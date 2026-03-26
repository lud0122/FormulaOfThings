/**
 * Parameter Table Module
 * Renders sortable parameter table with energy highlighting
 */

export const formatNumber = (num, decimals = 3) => {
  if (num === 0) return '0'
  const rounded = Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
  return String(rounded)
}

export const formatPercent = (num) => {
  return `${Math.round(num * 100)}%`
}

export const sortData = (data, key, ascending = true) => {
  return data.sort((a, b) => {
    const valA = a[key]
    const valB = b[key]
    const comparison = valA < valB ? -1 : valA > valB ? 1 : 0
    return ascending ? comparison : -comparison
  })
}

export const calculateTotalEnergy = (paramsData) => {
  return paramsData.reduce((sum, p) => sum + p.energy, 0)
}

export const isHighEnergy = (energy) => {
  return energy > 0.1
}

export const renderParameterTable = (paramsData) => {
  const table = document.createElement('table')
  table.className = 'parameter-table'

  let currentSort = { column: null, ascending: true }

  // Create header
  const thead = document.createElement('thead')
  const headerRow = document.createElement('tr')

  const headers = [
    { key: 'n', label: 'Harmonic (n)', sortable: true },
    { key: 'amplitude', label: 'Amplitude (A)', sortable: true },
    { key: 'phase', label: 'Phase (φ)', sortable: true },
    { key: 'energy', label: 'Energy (%)', sortable: true }
  ]

  headers.forEach(({ key, label, sortable }) => {
    const th = document.createElement('th')
    th.textContent = label
    if (sortable) {
      th.style.cursor = 'pointer'
      th.dataset.sortKey = key

      // Add click handler for sorting
      th.addEventListener('click', () => {
        if (currentSort.column === key) {
          currentSort.ascending = !currentSort.ascending
        } else {
          currentSort.column = key
          currentSort.ascending = true
        }

        // Re-render with sorted data
        const sortedData = sortData([...paramsData], key, currentSort.ascending)
        updateTableBody(table, sortedData)
        updateSortIndicators(table, key, currentSort.ascending)
      })
    }
    headerRow.appendChild(th)
  })

  thead.appendChild(headerRow)
  table.appendChild(thead)

  // Create body
  const tbody = document.createElement('tbody')
  table.appendChild(tbody)

  // Populate table
  updateTableBody(table, paramsData)

  // Create footer with total energy
  if (paramsData.length > 0) {
    const tfoot = document.createElement('tfoot')
    const footerRow = document.createElement('tr')

    const totalEnergy = calculateTotalEnergy(paramsData)

    const totalCell = document.createElement('td')
    totalCell.colSpan = 3
    totalCell.textContent = 'Total Energy:'
    footerRow.appendChild(totalCell)

    const energyCell = document.createElement('td')
    energyCell.textContent = formatPercent(totalEnergy)
    footerRow.appendChild(energyCell)

    tfoot.appendChild(footerRow)
    table.appendChild(tfoot)
  }

  return table
}

const updateTableBody = (table, paramsData) => {
  const tbody = table.querySelector('tbody')
  tbody.innerHTML = ''

  paramsData.forEach(param => {
    const row = document.createElement('tr')

    // Highlight high energy rows (> 10%)
    if (isHighEnergy(param.energy)) {
      row.classList.add('high-energy')
    }

    // Add cells
    const cells = [
      param.n,
      formatNumber(param.amplitude),
      formatNumber(param.phase),
      formatPercent(param.energy)
    ]

    cells.forEach(value => {
      const td = document.createElement('td')
      td.textContent = value
      row.appendChild(td)
    })

    tbody.appendChild(row)
  })
}

const updateSortIndicators = (table, activeKey, ascending) => {
  // Remove existing indicators
  table.querySelectorAll('th').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc')
  })

  // Add indicator to active column
  const activeHeader = table.querySelector(`th[data-sort-key="${activeKey}"]`)
  if (activeHeader) {
    activeHeader.classList.add(ascending ? 'sort-asc' : 'sort-desc')
  }
}
