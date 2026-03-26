/**
 * Formula Display Module
 * Renders Fourier series mathematical formula using HTML and Unicode
 */

const subscriptDigits = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
}

export const toSubscript = (num) => {
  return String(num).split('').map(d => subscriptDigits[d] || d).join('')
}

export const formatNumber = (num, decimals = 3) => {
  if (num === 0) return '0'
  const rounded = Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
  return String(rounded)
}

export const createTermHTML = (coeff, index) => {
  const { n, amplitude, phase } = coeff
  const nSub = toSubscript(n)
  const ampStr = formatNumber(amplitude)
  const phaseStr = formatNumber(phase)

  // Format: A_n · cos(nt + φ_n)
  const termHTML = `
    <span class="term" data-harmonic="${n}">
      <span class="amplitude">${ampStr}</span>
      <span class="operator">·</span>
      <span class="function">cos</span>
      <span class="argument">
        <span class="harmonic">${nSub}</span>t
        ${phase !== 0 ? ` + <span class="phase">${phaseStr}</span>` : ''}
      </span>
    </span>
  `
  return termHTML
}

export const buildFormulaHTML = (coeffs, termCount) => {
  let formulaHTML = '<div class="equation">f(t) = '

  // Add terms (limited by termCount)
  const limitedCoeffs = coeffs.slice(0, termCount)

  if (limitedCoeffs.length === 0) {
    formulaHTML += '<span class="zero">0</span>'
  } else {
    const terms = limitedCoeffs.map((coeff, index) => {
      const termHTML = createTermHTML(coeff, index)
      return (index > 0 ? '<span class="operator"> + </span>' : '') + termHTML
    })
    formulaHTML += terms.join('')
  }

  formulaHTML += '</div>'
  return formulaHTML
}

export const renderFormula = (coeffs, termCount) => {
  const container = document.createElement('div')
  container.className = 'formula-display'

  // Create title
  const title = document.createElement('h3')
  title.className = 'title'
  title.textContent = 'Fourier Series Representation'
  container.appendChild(title)

  // Create formula container
  const formula = document.createElement('div')
  formula.className = 'formula'
  formula.innerHTML = buildFormulaHTML(coeffs, termCount)

  container.appendChild(formula)

  return container
}
