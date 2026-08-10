/** Shared ngx-datatable height / page size for Products, Categories, and Brands tabs. */
export interface ProductsGridLayout {
  pageSize: number;
  gridHeight: string;
}

export interface ProductsGridLayoutOptions {
  extraRows?: number;
  /** Space reserved below the table (page padding / scrollbar). */
  layoutBuffer?: number;
}

const ROW_HEIGHT = 56;
const HEADER_HEIGHT = 48;
const FOOTER_HEIGHT = 30;
const DATATABLE_CHROME = HEADER_HEIGHT + FOOTER_HEIGHT;

/**
 * Measure from where the table sits in the viewport down to the window bottom.
 * Avoids subtracting header/tabs/search separately (those were inconsistent on tab switches).
 */
function resolveTableTop(hostElement: HTMLElement): number | null {
  const tableHost =
    (hostElement.querySelector('.gridAboveHeightInSaleOrderHistory .card.mb-3') as HTMLElement | null) ||
    (hostElement.querySelector('ngx-datatable') as HTMLElement | null);

  if (tableHost) {
    const top = tableHost.getBoundingClientRect().top;
    if (top > 0) {
      return top;
    }
  }

  const gridAbove = hostElement.querySelector(
    '.gridAboveHeightInSaleOrderHistory',
  ) as HTMLElement | null;
  if (gridAbove) {
    const toolbar = gridAbove.querySelector('.os-filter-toolbar') as HTMLElement | null;
    if (toolbar) {
      const bottom = toolbar.getBoundingClientRect().bottom;
      if (bottom > 0) {
        return bottom;
      }
    }

    const rows = gridAbove.querySelectorAll(':scope > .row');
    if (rows.length > 0) {
      // Prefer the search/toolbar row, not the table wrapper row.
      const candidate =
        rows.length > 1 ? (rows[0] as HTMLElement) : (rows[0] as HTMLElement);
      // If the only row is the table card row, use its top instead of bottom.
      if (candidate.querySelector('.card.mb-3, ngx-datatable')) {
        const top = candidate.getBoundingClientRect().top;
        if (top > 0) {
          return top;
        }
      } else {
        const bottom = candidate.getBoundingClientRect().bottom;
        if (bottom > 0) {
          return bottom;
        }
      }
    }
    const top = gridAbove.getBoundingClientRect().top;
    if (top > 0) {
      return top;
    }
  }

  return null;
}

export function calculateProductsGridLayout(
  hostElement: HTMLElement,
  options?: ProductsGridLayoutOptions,
): ProductsGridLayout {
  const extraRows = options?.extraRows ?? 0;
  const layoutBuffer = options?.layoutBuffer ?? 24;

  const tableTop = resolveTableTop(hostElement);
  let availableHeight: number;

  if (tableTop != null) {
    availableHeight = window.innerHeight - tableTop - layoutBuffer - DATATABLE_CHROME;
  } else {
    // Fallback before the tab DOM has a measurable position.
    availableHeight = window.innerHeight - 280 - layoutBuffer - DATATABLE_CHROME;
  }

  let pageSize = Math.floor(availableHeight / ROW_HEIGHT) + extraRows;
  if (pageSize <= 0) {
    pageSize = 5;
  }

  const bodyHeight = pageSize * ROW_HEIGHT;
  return {
    pageSize,
    gridHeight: `${bodyHeight + DATATABLE_CHROME}px`,
  };
}
