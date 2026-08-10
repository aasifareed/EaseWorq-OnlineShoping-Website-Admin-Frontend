/** Shared ngx-datatable height / page size for Order Status tabs. */
export interface StatusGridLayout {
  pageSize: number;
  gridHeight: string;
}

export interface StatusGridLayoutOptions {
  extraRows?: number;
  layoutBuffer?: number;
}

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 45;
const FOOTER_HEIGHT = 30;
const DATATABLE_CHROME = HEADER_HEIGHT + FOOTER_HEIGHT;

function resolveTableTop(hostElement: HTMLElement): number | null {
  const tableHost =
    (hostElement.querySelector('.card.mb-3') as HTMLElement | null) ||
    (hostElement.querySelector('ngx-datatable') as HTMLElement | null);

  if (tableHost) {
    const top = tableHost.getBoundingClientRect().top;
    if (top > 0) {
      return top;
    }
  }

  const gridAbove = hostElement.querySelector('.gridAboveHeight') as HTMLElement | null;
  if (gridAbove) {
    const bottom = gridAbove.getBoundingClientRect().bottom;
    if (bottom > 0) {
      return bottom;
    }
  }

  return null;
}

export function calculateStatusGridLayout(
  hostElement: HTMLElement,
  options?: StatusGridLayoutOptions,
): StatusGridLayout {
  const extraRows = options?.extraRows ?? 0;
  const layoutBuffer = options?.layoutBuffer ?? 24;

  const tableTop = resolveTableTop(hostElement);
  let availableHeight: number;

  if (tableTop != null) {
    availableHeight = window.innerHeight - tableTop - layoutBuffer - DATATABLE_CHROME;
  } else {
    availableHeight = window.innerHeight - 320 - layoutBuffer - DATATABLE_CHROME;
  }

  let pageSize = Math.floor(availableHeight / ROW_HEIGHT) + extraRows;
  if (pageSize <= 0) {
    pageSize = 5;
  }

  return {
    pageSize,
    gridHeight: `${pageSize * ROW_HEIGHT + DATATABLE_CHROME}px`,
  };
}
