const LENSES = ['real', 'dev', 'normie', 'chinese', 'hindi', 'german']

let TO_REAL = {}
let FROM_REAL = {}
let SORTED_TOKENS = {}

function initTranslator(symbols) {
  LENSES.forEach(lens => {
    TO_REAL[lens] = {}
    FROM_REAL[lens] = {}
  })

  for (const [name, entry] of Object.entries(symbols)) {
    LENSES.forEach(lens => {
      const tok = entry[lens]
      if (tok !== undefined) {
        TO_REAL[lens][tok] = name
        FROM_REAL[lens][name] = tok
      }
    })
  }

  LENSES.forEach(lens => {
    SORTED_TOKENS[lens] = Object.keys(TO_REAL[lens])
      .sort((a, b) => b.length - a.length)
  })
}

function tokenize(code, lens) {
  const tokens = []
  const sorted = SORTED_TOKENS[lens]
  let i = 0

  while (i < code.length) {
    if (/\s/.test(code[i])) {
      let ws = ''
      while (i < code.length && /\s/.test(code[i])) ws += code[i++]
      tokens.push({ type: 'ws', value: ws })
      continue
    }

    if (code[i] === '/' && code[i + 1] === '/') {
      let comment = ''
      while (i < code.length && code[i] !== '\n') comment += code[i++]
      tokens.push({ type: 'comment', value: comment })
      continue
    }

    if (code[i] === '/' && code[i + 1] === '*') {
      let comment = '/*'
      i += 2
      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) comment += code[i++]
      if (i < code.length) { comment += '*/'; i += 2 }
      tokens.push({ type: 'comment', value: comment })
      continue
    }

    if (code[i] === '"' || code[i] === "'") {
      const quote = code[i]
      let str = quote
      i++
      while (i < code.length) {
        if (code[i] === '\\') { str += code[i] + code[i + 1]; i += 2; continue }
        str += code[i]
        if (code[i] === quote) { i++; break }
        i++
      }
      tokens.push({ type: 'string', value: str })
      continue
    }

    let matched = false
    for (const tok of sorted) {
      if (code.startsWith(tok, i)) {
        // Only apply word boundary check when token is purely alphanumeric (starts AND ends with word char)
        const isWord = /^[A-Za-z_]/.test(tok) && /[A-Za-z0-9_]$/.test(tok)
        if (isWord) {
          const after = code[i + tok.length]
          if (after && /[A-Za-z0-9_]/.test(after)) continue
        }
        tokens.push({ type: 'token', value: tok })
        i += tok.length
        matched = true
        break
      }
    }
    if (matched) continue

    if (/[A-Za-z_À-￿]/.test(code[i])) {
      let word = ''
      while (i < code.length && /[A-Za-z0-9_À-￿]/.test(code[i])) word += code[i++]
      tokens.push({ type: 'unknown', value: word })
    } else {
      tokens.push({ type: 'unknown', value: code[i++] })
    }
  }

  return tokens
}

function getTokens(code, lens) {
  if (!SORTED_TOKENS[lens]) return []
  return tokenize(code, lens).map(tok => ({
    type: tok.type,
    value: tok.value,
    symbolName: tok.type === 'token' ? (TO_REAL[lens][tok.value] || null) : null
  }))
}

function translate(code, fromLens, toLens) {
  if (fromLens === toLens) return code
  const tokens = tokenize(code, fromLens)

  return tokens.map(tok => {
    if (tok.type !== 'token') return tok.value
    const symbolName = TO_REAL[fromLens][tok.value]
    if (symbolName === undefined) return tok.value
    const result = FROM_REAL[toLens][symbolName]
    return result !== undefined ? result : tok.value
  }).join('')
}
