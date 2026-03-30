/**
 * Fourier Formula Generator
 * Generates readable formula strings and parameter tables from Fourier coefficients
 */

/**
 * Generate formula strings for x(t) and y(t)
 * @param {Object} coefficients - Fourier coefficients {a, b, c, d} 或 {a, b}
 * @returns {string} Formula string representation
 */
export function generateFormula(coefficients) {
  if (!coefficients) {
    throw new Error('Missing coefficients');
  }

  const { a, b, c = a, d = b } = coefficients;

  if (!a || !b) {
    throw new Error('Missing required coefficient arrays (a, b)');
  }

  if (a.length !== b.length || a.length !== c.length || a.length !== d.length) {
    throw new Error('Mismatched coefficient array lengths');
  }

  const lines = [];
  lines.push('傅里叶级数公式：');
  lines.push('');
  lines.push('x(t) = a₀ + Σ[aₙcos(nt) + bₙsin(nt)]');
  lines.push('y(t) = c₀ + Σ[cₙcos(nt) + dₙsin(nt)]');

  return lines.join('\n');
}

/**
 * Generate parameter table from Fourier coefficients
 * @param {Object} coefficients - Fourier coefficients {a, b, c, d} 或 {a, b}
 * @returns {Array} Parameter table with radius, angular velocity, phase, and energy ratio
 */
export function generateParameterTable(coefficients) {
  if (!coefficients) {
    throw new Error('Missing coefficients');
  }

  const { a, b, c = a, d = b } = coefficients;

  if (!a || !b) {
    throw new Error('Missing required coefficient arrays (a, b)');
  }

  if (a.length !== b.length || a.length !== c.length || a.length !== d.length) {
    throw new Error('Mismatched coefficient array lengths');
  }

  const termCount = a.length;

  // Calculate total energy for normalization
  let totalEnergy = 0;
  const intermediateResults = [];

  for (let n = 0; n < termCount; n++) {
    // 计算复数系数的模：c_n = a_n + i*b_n
    // r_n = |c_n| = sqrt(a_n² + b_n²)
    const radiusX = Math.sqrt(a[n] * a[n] + b[n] * b[n]);
    const radiusY = Math.sqrt(c[n] * c[n] + d[n] * d[n]);

    // Combined radius for energy calculation
    const radius = Math.sqrt(radiusX * radiusX + radiusY * radiusY);

    // 计算相位：φₙ = atan2(bₙ, aₙ)
    const phaseX = Math.atan2(b[n], a[n]);
    const phaseY = Math.atan2(d[n], c[n]);

    // Angular velocity: ωₙ = n
    const angularVelocity = n;

    intermediateResults.push({
      n,
      radiusX,
      radiusY,
      radius,
      angularVelocity,
      phaseX,
      phaseY
    });

    totalEnergy += radius * radius;
  }

  // Calculate energy ratios
  const table = intermediateResults.map(result => {
    const energyRatio = totalEnergy > 0 ? (result.radius * result.radius) / totalEnergy : 0;

    return {
      n: result.n,
      radiusX: result.radiusX,
      radiusY: result.radiusY,
      radius: result.radius,
      angularVelocity: result.angularVelocity,
      phaseX: result.phaseX,
      phaseY: result.phaseY,
      energyRatio: energyRatio
    };
  });

  return table;
}

/**
 * Export Fourier coefficients to JSON format
 * @param {Object} coefficients - Fourier coefficients {a, b, c, d} 或 {a, b}
 * @returns {Object} JSON structure with metadata, coefficients, and parameters
 */
export function exportToJSON(coefficients) {
  if (!coefficients) {
    throw new Error('Missing coefficients');
  }

  const { a, b, c = a, d = b } = coefficients;

  if (!a || !b) {
    throw new Error('Missing required coefficient arrays (a, b)');
  }

  if (a.length !== b.length || a.length !== c.length || a.length !== d.length) {
    throw new Error('Mismatched coefficient array lengths');
  }

  const termCount = a.length;
  const parameterTable = generateParameterTable(coefficients);

  // Calculate cumulative energy ratio (e.g., 0.95 for 95% energy)
  let cumulativeEnergy = 0;
  let significantTerms = 0;

  for (const param of parameterTable) {
    cumulativeEnergy += param.energyRatio;
    significantTerms++;
    if (cumulativeEnergy >= 0.95) {
      break;
    }
  }

  const energyRatio = cumulativeEnergy;

  return {
    metadata: {
      termCount,
      energyRatio
    },
    coefficients: {
      a: [...a],
      b: [...b],
      c: [...c],
      d: [...d]
    },
    parameters: parameterTable.map(param => ({
      n: param.n,
      radius: param.radius,
      angularVelocity: param.angularVelocity,
      phase: param.phaseX, // Use x-phase as primary
      energyRatio: param.energyRatio
    }))
  };
}
