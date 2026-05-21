/** Shared ngx-datatable height / page size for Products, Categories, and Brands tabs. */
export interface ProductsGridLayout {
  pageSize: number;
  gridHeight: string;
}

export interface ProductsGridLayoutOptions {
  extraRows?: number;
  layoutBuffer?: number;
}

const ROW_HEIGHT = 56;
const HEADER_HEIGHT = 48;
const FOOTER_HEIGHT = 30;
const DATATABLE_CHROME = HEADER_HEIGHT + FOOTER_HEIGHT;

function subtractChromeAboveTable(hostElement: HTMLElement, availableHeight: number): number {
  const separator = hostElement.querySelector('.separator-breadcrumb') as HTMLElement | null;
  if (separator) {
    availableHeight -= separator.offsetHeight;
  }

  const gridAbove = hostElement.querySelector('.gridAboveHeightInSaleOrderHistory');
  if (gridAbove) {
    const alert = gridAbove.querySelector('.alert') as HTMLElement | null;
    if (alert) {
      availableHeight -= alert.offsetHeight;
    }

    const rows = gridAbove.querySelectorAll(':scope > .row');
    if (rows.length > 0) {
      availableHeight -= (rows[0] as HTMLElement).offsetHeight;
    }
  }

  return availableHeight;
}

export function calculateProductsGridLayout(
  hostElement: HTMLElement,
  options?: ProductsGridLayoutOptions,
): ProductsGridLayout {
  const extraRows = options?.extraRows ?? 0;
  const layoutBuffer = options?.layoutBuffer ?? 24;
  const viewportChrome = 138;

  let availableHeight = window.innerHeight - viewportChrome;

  const mainHeader = document.querySelector('.main-header') as HTMLElement | null;
  if (mainHeader) {
    availableHeight -= mainHeader.offsetHeight;
  }

  const tabs = document.querySelector('.tabs__links') as HTMLElement | null;
  if (tabs) {
    availableHeight -= tabs.offsetHeight;
  }

  availableHeight = subtractChromeAboveTable(hostElement, availableHeight);
  availableHeight -= layoutBuffer + DATATABLE_CHROME;

  let pageSize = Math.floor(availableHeight / ROW_HEIGHT) + 1 + extraRows;
  if (pageSize <= 0) {
    pageSize = 5;
  }

  const bodyHeight = pageSize * ROW_HEIGHT;
  return {
    pageSize,
    gridHeight: `${bodyHeight + DATATABLE_CHROME}px`,
  };
}
