import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  generateFormula,
  generateParameterTable,
  exportToJSON
} from '../../src/fourier-analyzer/formula-generator.js';

describe('Formula Generator', () => {
  describe('generateFormula', () => {
    it('should generate formula strings for x(t) and y(t)', () => {
      const coefficients = {
        a: [100, 50, 25],
        b: [0, 30, 15],
        c: [80, 40, 20],
        d: [0, 20, 10]
      };

      const result = generateFormula(coefficients);

      assert.ok(result.includes('x(t)'));
      assert.ok(result.includes('y(t)'));
      assert.ok(result.includes('a₀'));
      assert.ok(result.includes('Σ'));
      assert.ok(result.includes('cos'));
      assert.ok(result.includes('sin'));
    });

    it('should handle single-term coefficients', () => {
      const coefficients = {
        a: [100],
        b: [0],
        c: [80],
        d: [0]
      };

      const result = generateFormula(coefficients);

      assert.ok(result.includes('x(t)'));
      assert.ok(result.includes('y(t)'));
    });

    it('should throw error for missing coefficients', () => {
      assert.throws(() => {
        generateFormula(null);
      }, /Missing coefficients/);
    });

    it('should throw error for mismatched coefficient array lengths', () => {
      const coefficients = {
        a: [100, 50],
        b: [0],
        c: [80, 40],
        d: [0, 20]
      };

      assert.throws(() => {
        generateFormula(coefficients);
      }, /Mismatched coefficient array lengths/);
    });
  });

  describe('generateParameterTable', () => {
    it('should generate parameter table with correct calculations', () => {
      const coefficients = {
        a: [100, 50, 25],
        b: [0, 30, 15],
        c: [80, 40, 20],
        d: [0, 20, 10]
      };

      const table = generateParameterTable(coefficients);

      assert.equal(table.length, 3);
      assert.equal(table[0].n, 0);
      assert.equal(table[1].n, 1);
      assert.equal(table[2].n, 2);

      // Check radius calculation: rₙ = sqrt(aₙ² + bₙ²)
      assert.ok(Math.abs(table[0].radiusX - 100) < 0.01);
      assert.ok(Math.abs(table[1].radiusX - Math.sqrt(50*50 + 30*30)) < 0.01);

      // Check angular velocity: ωₙ = n
      assert.equal(table[0].angularVelocity, 0);
      assert.equal(table[1].angularVelocity, 1);
      assert.equal(table[2].angularVelocity, 2);

      // Check phase calculation: φₙ = atan2(bₙ, aₙ)
      assert.ok(Math.abs(table[0].phaseX) < 0.01);
      assert.ok(Math.abs(table[1].phaseX - Math.atan2(30, 50)) < 0.01);
    });

    it('should calculate energy ratio correctly', () => {
      const coefficients = {
        a: [100, 50, 25],
        b: [0, 30, 15],
        c: [80, 40, 20],
        d: [0, 20, 10]
      };

      const table = generateParameterTable(coefficients);

      // Energy ratios should sum to 1 (or close to 1)
      const totalEnergy = table.reduce((sum, row) => sum + row.energyRatio, 0);
      assert.ok(Math.abs(totalEnergy - 1) < 0.01);
    });

    it('should handle zero coefficients', () => {
      const coefficients = {
        a: [100, 0, 0],
        b: [0, 0, 0],
        c: [80, 0, 0],
        d: [0, 0, 0]
      };

      const table = generateParameterTable(coefficients);

      assert.equal(table.length, 3);
      assert.ok(Math.abs(table[0].radiusX - 100) < 0.01);
      assert.equal(table[1].radiusX, 0);
      assert.equal(table[2].radiusX, 0);
    });

    it('should throw error for invalid coefficients', () => {
      assert.throws(() => {
        generateParameterTable(null);
      }, /Missing coefficients/);
    });
  });

  describe('exportToJSON', () => {
    it('should export to JSON with correct structure', () => {
      const coefficients = {
        a: [100, 50, 25],
        b: [0, 30, 15],
        c: [80, 40, 20],
        d: [0, 20, 10]
      };

      const json = exportToJSON(coefficients);

      assert.ok(json.metadata);
      assert.ok(json.coefficients);
      assert.ok(json.parameters);

      assert.equal(json.metadata.termCount, 3);
      assert.ok(json.metadata.energyRatio > 0);

      assert.deepEqual(json.coefficients.a, [100, 50, 25]);
      assert.deepEqual(json.coefficients.b, [0, 30, 15]);

      assert.equal(json.parameters.length, 3);
      assert.ok(json.parameters[0].n === 0);
      assert.ok(json.parameters[0].radius !== undefined);
      assert.ok(json.parameters[0].angularVelocity !== undefined);
      assert.ok(json.parameters[0].phase !== undefined);
      assert.ok(json.parameters[0].energyRatio !== undefined);
    });

    it('should include all required fields in parameters', () => {
      const coefficients = {
        a: [100, 50],
        b: [0, 30],
        c: [80, 40],
        d: [0, 20]
      };

      const json = exportToJSON(coefficients);

      json.parameters.forEach(param => {
        assert.ok('n' in param);
        assert.ok('radius' in param);
        assert.ok('angularVelocity' in param);
        assert.ok('phase' in param);
        assert.ok('energyRatio' in param);
      });
    });

    it('should throw error for invalid coefficients', () => {
      assert.throws(() => {
        exportToJSON(null);
      }, /Missing coefficients/);
    });

    it('should produce valid JSON string when serialized', () => {
      const coefficients = {
        a: [100, 50],
        b: [0, 30],
        c: [80, 40],
        d: [0, 20]
      };

      const json = exportToJSON(coefficients);
      const jsonString = JSON.stringify(json);

      assert.doesNotThrow(() => {
        JSON.parse(jsonString);
      });
    });
  });
});
