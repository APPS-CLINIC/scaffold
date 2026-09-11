/**
 * Runtime stand-in for `iwa-react-components` under vitest.
 *
 * `vite.config.ts` aliases the package to this file for tests only, so no test loads the
 * real design system. That matters because `src/ui/index.ts` re-exports the package at
 * module top level: importing anything from `@/ui` — `createPrimeIcon` in the navigation
 * manifest, for instance — pulls the whole library in, which is why even pure-logic tests
 * depend on it resolving. Type checking and the production build still use the real
 * package; only the test runtime is swapped.
 *
 * Keep the rendered structure faithful to the real components. Tests query it by role and
 * accessible name, so a shape that drifts from the library makes them assert a fiction.
 * `Table` delegates to PrimeReact because the IWA table is a styled PrimeReact DataTable.
 */

import { createElement, useState } from 'react';
import { DataTable } from 'primereact/datatable';

export function Table({ dataTableRef, separatedRows, ...props }) {
  return createElement(DataTable, { ...props, ref: dataTableRef ?? undefined });
}

export function PaginatorTable(props) {
  return createElement(Table, { paginator: true, ...props });
}

export function twMerge(...classLists) {
  const tokens = classLists.filter(Boolean).flatMap((classList) => classList.trim().split(/\s+/));
  const groupFor = (token) => {
    if (/^min-w-/.test(token)) return 'min-width';
    if (/^overflow-x-/.test(token)) return 'overflow-x';
    if (/^overflow-y-/.test(token)) return 'overflow-y';
    if (/^overflow-/.test(token)) return 'overflow';
    if (/^text-(xs|sm|base|lg|xl|[2-9]xl)$/.test(token)) return 'font-size';
    return undefined;
  };
  const result = [];

  for (const token of tokens) {
    const group = groupFor(token);
    if (group) {
      const existingIndex = result.findIndex((candidate) => groupFor(candidate) === group);
      if (existingIndex >= 0) result.splice(existingIndex, 1);
    }
    result.push(token);
  }

  return result.join(' ');
}

function TopBarBase({ logo, items = [], children, onLogoClick, ...props }) {
  return createElement(
    'div',
    props,
    createElement('button', { type: 'button', onClick: onLogoClick }, logo),
    children,
    items,
  );
}

TopBarBase.Item = function TopBarItem({ label, icon, onClick }) {
  return createElement('button', { type: 'button', onClick }, icon, label);
};

export const TopBar = TopBarBase;

export function TabMenu({ activeIndex, items = [], onChangeActiveIndex }) {
  return createElement(
    'div',
    null,
    items.map((item, index) =>
      createElement(
        'button',
        {
          key: item.label,
          type: 'button',
          'aria-selected': index === activeIndex,
          onClick: () => onChangeActiveIndex?.(index),
        },
        item.label,
      ),
    ),
  );
}

export function NavigationPanel({ title, footer, children }) {
  return createElement('section', null, createElement('h2', null, title), children, footer);
}

export function MenuList({ items = [], selectedIndex, buttonClassName, onSelectedIndexChange }) {
  return createElement(
    'div',
    null,
    items.map((item, index) =>
      createElement(
        'button',
        {
          key: item.id,
          type: 'button',
          className: buttonClassName,
          'aria-selected': index === selectedIndex,
          onClick: () => onSelectedIndexChange?.(index),
        },
        item.icon,
        item.text,
        item.slot,
      ),
    ),
  );
}

/*
 * Components below mirror the real IWA library as documented from its
 * Storybook (see .design/iwa-components/ in the consuming repo). Colors are
 * literal on purpose: the real package ships its own palette (#FF6200 brand
 * orange, #A8A8A8 disabled) and does not read the host app's tokens.
 */

const svgIcon = (children, extra = {}) =>
  createElement(
    'svg',
    {
      viewBox: '0 0 20 20',
      width: 20,
      height: 20,
      'aria-hidden': 'true',
      focusable: 'false',
      ...extra,
    },
    children,
  );

const STATUS_ICONS = {
  active: () =>
    svgIcon([
      createElement('circle', { key: 'c', cx: 10, cy: 10, r: 9, fill: '#3f9c35' }),
      createElement('path', {
        key: 'p',
        d: 'M5.5 10.5l3 3 6-6.5',
        stroke: '#ffffff',
        strokeWidth: 2,
        fill: 'none',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }),
    ]),
  disabled: () =>
    svgIcon([
      createElement('circle', { key: 'c', cx: 10, cy: 10, r: 9, fill: '#a8a8a8' }),
      createElement('path', {
        key: 'p',
        d: 'M7 7l6 6M13 7l-6 6',
        stroke: '#ffffff',
        strokeWidth: 2,
        strokeLinecap: 'round',
      }),
    ]),
  awaiting: () =>
    svgIcon([
      createElement('circle', { key: 'c', cx: 10, cy: 10, r: 9, fill: '#ffb400' }),
      createElement('path', {
        key: 'p',
        d: 'M10 5.5V10l3 2',
        stroke: '#ffffff',
        strokeWidth: 2,
        fill: 'none',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }),
    ]),
  incomplete: () =>
    svgIcon([
      createElement('path', { key: 't', d: 'M10 1.5L19.5 18H.5Z', fill: '#e8501e' }),
      createElement('path', {
        key: 'p',
        d: 'M10 7v5',
        stroke: '#ffffff',
        strokeWidth: 2,
        strokeLinecap: 'round',
      }),
      createElement('circle', { key: 'd', cx: 10, cy: 15, r: 1.2, fill: '#ffffff' }),
    ]),
  notAvailable: () =>
    svgIcon([
      createElement('circle', { key: 'c', cx: 10, cy: 10, r: 9, fill: '#a8a8a8' }),
      createElement('path', {
        key: 'p',
        d: 'M6 10h8',
        stroke: '#ffffff',
        strokeWidth: 2,
        strokeLinecap: 'round',
      }),
    ]),
};

export function Status({ type, label, className, dataTestId }) {
  return createElement(
    'div',
    {
      className: twMerge('inline-flex items-center gap-2', className),
      'data-testid': dataTestId,
    },
    createElement(
      'span',
      { className: 'flex h-5 w-5 shrink-0 items-center justify-center' },
      STATUS_ICONS[type]?.(),
    ),
    createElement('span', { className: 'text-base text-[#333333]' }, label),
  );
}

export function Switch({
  checked,
  disabled,
  readOnly,
  onChange,
  className,
  dataTestId,
  'aria-label': ariaLabel,
}) {
  return createElement(
    'button',
    {
      type: 'button',
      role: 'switch',
      'aria-label': ariaLabel,
      'aria-checked': Boolean(checked),
      'aria-readonly': readOnly || undefined,
      disabled,
      'data-testid': dataTestId,
      onClick: () => {
        if (disabled || readOnly) return;
        onChange?.(!checked);
      },
      className: twMerge(
        'relative inline-flex h-[22px] w-10 shrink-0 items-center rounded-full transition-colors motion-reduce:transition-none',
        checked ? 'bg-[#3d9a68]' : 'border border-[#b0b0b0] bg-[#f0f0f0]',
        disabled && 'opacity-50',
        className,
      ),
    },
    createElement('span', {
      className: twMerge(
        'absolute h-4 w-4 rounded-full transition-transform motion-reduce:transition-none',
        checked ? 'left-0.5 translate-x-[18px] bg-white' : 'left-0.5 translate-x-0 bg-[#4d4d4d]',
      ),
    }),
  );
}

const INLINE_LINK_SIZES = {
  small: 'text-xs',
  medium: 'text-sm',
  large: 'text-base',
  'very-large': 'text-lg',
};

export function InlineLink({
  label,
  url,
  size = 'large',
  external,
  openInNewTab,
  onClick,
  className,
  innerWrapperClassName,
  dataTestId,
}) {
  const linkClassName = twMerge(
    'inline text-[#506579] underline decoration-1 underline-offset-2',
    INLINE_LINK_SIZES[size] ?? INLINE_LINK_SIZES.large,
    (url || onClick) && 'cursor-pointer hover:text-[#ff6200] hover:decoration-2',
    className,
  );
  const content = createElement(
    'span',
    {
      className: twMerge(
        'inline-block max-w-full cursor-default truncate align-bottom',
        innerWrapperClassName,
      ),
    },
    label,
  );

  if (!url && !onClick) {
    return createElement('span', { className: linkClassName, 'data-testid': dataTestId }, content);
  }

  return createElement(
    'a',
    {
      href: url,
      target: openInNewTab ? '_blank' : undefined,
      rel: external || openInNewTab ? 'noreferrer' : undefined,
      onClick,
      className: linkClassName,
      'data-testid': dataTestId,
    },
    content,
  );
}

export function ActionLink({ icon, label, onClick, disabled, className, dataTestId }) {
  const [pending, setPending] = useState(false);
  const blocked = disabled || pending;

  return createElement(
    'button',
    {
      type: 'button',
      disabled: blocked,
      'data-testid': dataTestId,
      onClick: () => {
        if (blocked) return;
        const result = onClick?.();
        if (result && typeof result.then === 'function') {
          setPending(true);
          void Promise.resolve(result).finally(() => setPending(false));
        }
      },
      className: twMerge(
        'inline-flex items-center gap-1.5 text-sm',
        blocked ? 'cursor-default text-[#a8a8a8]' : 'text-[#ff6200]',
        className,
      ),
    },
    icon
      ? createElement(
          'span',
          { className: 'flex shrink-0 items-center', 'aria-hidden': 'true' },
          icon,
        )
      : null,
    createElement('span', { className: 'underline underline-offset-2' }, label),
  );
}

export function ScreenHeading({ pageName, items = [], isLoading, className, dataTestId, ...rest }) {
  if (isLoading) {
    return createElement(
      'div',
      {
        className: twMerge('flex animate-pulse flex-col gap-2', className),
        'data-testid': dataTestId,
      },
      createElement('span', { className: 'h-4 w-32 rounded bg-[#ededed]' }),
      createElement('span', { className: 'h-9 w-72 rounded bg-[#ededed]' }),
    );
  }

  return createElement(
    'div',
    { className: twMerge('flex flex-col gap-1', className), 'data-testid': dataTestId },
    items.length > 0
      ? createElement(
          'p',
          { className: 'm-0 text-sm text-[#696969]' },
          'Wróć do: ',
          items.map((item, index) =>
            createElement(InlineLink, {
              key: item.label ?? index,
              label: item.label,
              url: item.url,
              onClick: item.onClick,
              size: 'small',
            }),
          ),
        )
      : null,
    createElement(
      'h1',
      { ...rest, className: 'm-0 text-4xl font-bold leading-[48px] text-[#ff6200]' },
      pageName,
    ),
  );
}

export function Card({ children, header, footer, interactive, className, dataTestId }) {
  return createElement(
    'div',
    {
      className: twMerge(
        'p-card rounded border border-[#e0e0e0] bg-white p-3',
        interactive &&
          'cursor-pointer transition-shadow hover:shadow-sm motion-reduce:transition-none',
        className,
      ),
      'data-testid': dataTestId,
    },
    header ? createElement('div', { className: 'border-b border-[#e0e0e0] p-4' }, header) : null,
    createElement('div', { className: 'p-card-body p-5' }, children),
    footer ? createElement('div', { className: 'border-t border-[#e0e0e0] p-4' }, footer) : null,
  );
}

export function DefinitionList({ title, body, status, links = [], collapsible }) {
  const renderText = (part, hintClassName) =>
    part
      ? [
          createElement(
            'div',
            {
              key: 'text',
              className: twMerge('text-sm text-[#333333]', part.bold && 'font-bold'),
            },
            part.text,
          ),
          part.hint
            ? createElement(
                'div',
                { key: 'hint', className: twMerge('text-xs text-[#8a8f98]', hintClassName) },
                part.hint,
              )
            : null,
        ]
      : null;

  return createElement(
    'dl',
    { className: 'm-0 flex min-w-0 gap-4' },
    createElement('dt', { className: 'w-40 shrink-0 text-right' }, renderText(title)),
    createElement(
      'dd',
      { className: 'm-0 min-w-0 flex-1 space-y-0.5 break-words' },
      status ?? null,
      renderText(body),
      links.map((link, index) => createElement('div', { key: index }, link)),
      collapsible ?? null,
    ),
  );
}

export function SkeletonTable({
  rowCount = 3,
  columns = [],
  delayDiffBetweenRows = 50,
  className,
  dataTestId,
}) {
  const columnWidth = (column) => {
    if (column?.width === undefined) return undefined;
    return typeof column.width === 'number' ? `${column.width}px` : column.width;
  };
  const headerCells = (columns.length > 0 ? columns : [{}, {}, {}]).map((column, index) =>
    createElement('span', {
      key: index,
      className: 'h-3.5 rounded bg-[#dddddd]',
      style: {
        width: columnWidth(column),
        flex: columnWidth(column) ? '0 0 auto' : '1 1 0%',
      },
    }),
  );

  return createElement(
    'div',
    { className: twMerge('w-full', className), 'aria-hidden': 'true', 'data-testid': dataTestId },
    createElement('div', { className: 'flex items-center gap-4 pb-4 pt-2' }, headerCells),
    Array.from({ length: Math.max(0, rowCount) }, (unused, index) =>
      createElement(
        'div',
        {
          key: index,
          className: 'animate-pulse py-2.5',
          style: { animationDelay: `${index * delayDiffBetweenRows}ms` },
        },
        createElement('span', { className: 'block h-3 w-full rounded bg-[#ededed]' }),
      ),
    ),
    createElement('div', { className: 'mt-3 h-3 w-40 rounded bg-[#dddddd]' }),
  );
}

export function SearchWithAutocomplete({
  placeholder,
  className,
  errorMessage,
  disabled,
  readOnly,
  onBlur,
  labelProps,
  suggestOnFocus,
  valueReturnedOnClear,
  dataTestId,
}) {
  return createElement(
    'div',
    { className: twMerge('relative inline-block', className) },
    createElement('input', {
      type: 'text',
      placeholder,
      disabled,
      readOnly,
      onBlur,
      'data-testid': dataTestId,
      className: twMerge(
        'h-10 w-full rounded border border-[#c9c9c9] bg-white pl-3 pr-10 text-sm text-[#333333] placeholder:text-[#8a8a8a] focus:border-[#ff6200] focus:outline-none',
        disabled && 'opacity-50',
      ),
    }),
    createElement(
      'span',
      {
        className: 'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2',
        'aria-hidden': 'true',
      },
      svgIcon(
        [
          createElement('circle', {
            key: 'c',
            cx: 8.5,
            cy: 8.5,
            r: 5.5,
            stroke: '#ff6200',
            strokeWidth: 2,
            fill: 'none',
          }),
          createElement('path', {
            key: 'h',
            d: 'M12.8 12.8L17.5 17.5',
            stroke: '#ff6200',
            strokeWidth: 2,
            strokeLinecap: 'round',
          }),
        ],
        { width: 18, height: 18 },
      ),
    ),
    errorMessage
      ? createElement('p', { className: 'm-0 mt-1 text-xs text-[#d70000]' }, errorMessage)
      : null,
  );
}

const ICON_TEXT_BUTTON_SIZES = {
  medium: 'px-3 py-1.5 text-sm',
  large: 'px-4 py-2 text-base',
  'very-large': 'px-5 py-2.5 text-lg',
};

const ICON_TEXT_BUTTON_STYLES = {
  filled: {
    primary: 'bg-[#ff6200] text-white',
    secondary: 'bg-[#262d62] text-white',
  },
  outline: {
    primary: 'border-2 border-[#ff6200] bg-white text-[#ff6200]',
    secondary: 'border-2 border-[#262d62] bg-white text-[#262d62]',
  },
  text: {
    primary: 'text-[#ff6200]',
    secondary: 'text-[#262d62]',
  },
};

export function IconTextButton({
  icon,
  label,
  style = 'filled',
  size = 'medium',
  secondary,
  disabled,
  loading,
  className,
  dataTestId,
  onClick,
}) {
  const [pending, setPending] = useState(false);
  const blocked = disabled || loading || pending;
  const scheme = ICON_TEXT_BUTTON_STYLES[style]?.[secondary ? 'secondary' : 'primary'];

  return createElement(
    'button',
    {
      type: 'button',
      disabled: blocked,
      'data-testid': dataTestId,
      onClick: () => {
        if (blocked) return;
        const result = onClick?.();
        if (result && typeof result.then === 'function') {
          setPending(true);
          void Promise.resolve(result).finally(() => setPending(false));
        }
      },
      className: twMerge(
        'inline-flex items-center gap-2 rounded font-medium',
        ICON_TEXT_BUTTON_SIZES[size] ?? ICON_TEXT_BUTTON_SIZES.medium,
        scheme,
        blocked && 'cursor-default opacity-50',
        className,
      ),
    },
    icon
      ? createElement(
          'span',
          { className: 'flex shrink-0 items-center', 'aria-hidden': 'true' },
          icon,
        )
      : null,
    createElement('span', null, label),
  );
}

const BUTTON_STYLES = {
  filled: {
    primary: 'bg-[#ff6200] text-white',
    secondary: 'bg-[#262d62] text-white',
  },
  outline: {
    primary: 'border-2 border-[#ff6200] bg-white text-[#ff6200]',
    secondary: 'border-2 border-[#262d62] bg-white text-[#262d62]',
  },
  text: {
    primary: 'text-[#ff6200]',
    secondary: 'text-[#262d62]',
  },
};

export function Button({
  label,
  onClick,
  style = 'filled',
  size = 'medium',
  secondary,
  disabled,
  loading,
  className,
  dataTestId,
}) {
  const [pending, setPending] = useState(false);
  const blocked = disabled || loading || pending;

  return createElement(
    'button',
    {
      type: 'button',
      disabled: blocked,
      'data-testid': dataTestId,
      onClick: () => {
        if (blocked) return;
        const result = onClick?.();
        if (result && typeof result.then === 'function') {
          setPending(true);
          void Promise.resolve(result).finally(() => setPending(false));
        }
      },
      className: twMerge(
        'inline-flex items-center gap-2 rounded font-medium',
        ICON_TEXT_BUTTON_SIZES[size] ?? ICON_TEXT_BUTTON_SIZES.medium,
        BUTTON_STYLES[style]?.[secondary ? 'secondary' : 'primary'],
        blocked && 'cursor-default opacity-50',
        className,
      ),
    },
    createElement('span', null, label),
  );
}

export function Select({
  options = [],
  value,
  onChange,
  placeholder,
  disabled,
  readOnly,
  errorMessage,
  optionLabel,
  className,
  dataTestId,
  'aria-label': ariaLabel,
}) {
  const toValue = (option) =>
    typeof option === 'object' && option !== null ? option.value : option;
  const toLabel = (option) =>
    typeof option === 'object' && option !== null
      ? ((optionLabel ? option[optionLabel] : option.label) ?? String(option.value))
      : String(option);

  return createElement(
    'div',
    { className: twMerge('inline-block', className) },
    createElement(
      'select',
      {
        value: value ?? '',
        disabled: disabled || readOnly,
        'data-testid': dataTestId,
        'aria-label': ariaLabel,
        // IWA's Select takes PrimeReact Dropdown props: onChange receives a change event
        // whose `value` is the picked option's value, never the bare value.
        onChange: (event) => {
          const picked = event.target.value || null;
          onChange?.({
            originalEvent: event,
            value: picked,
            stopPropagation: () => event.stopPropagation(),
            preventDefault: () => event.preventDefault(),
            target: { name: undefined, id: undefined, value: picked },
          });
        },
        className: twMerge(
          'h-10 w-full appearance-none rounded border border-[#c4c9ce] bg-white pl-3 pr-8 text-sm text-[#333333]',
          "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%226%22><path d=%22M0 0l5 6 5-6z%22 fill=%22%234a4f55%22/></svg>')] bg-[position:right_0.75rem_center] bg-no-repeat",
          !value && 'text-[#8a8a8a]',
          (disabled || readOnly) && 'opacity-50',
          errorMessage && 'border-[#d70000]',
        ),
      },
      createElement('option', { value: '' }, placeholder ?? ''),
      options.map((option, index) =>
        createElement('option', { key: index, value: toValue(option) }, toLabel(option)),
      ),
    ),
    errorMessage
      ? createElement('p', { className: 'm-0 mt-1 text-xs text-[#d70000]' }, errorMessage)
      : null,
  );
}

export function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  disabled,
  readOnly,
  errorMessage,
  className,
  inputClassName,
  id,
  name,
  dataTestId,
  dateInputTestId = 'ing-date-input',
  'aria-label': ariaLabel,
}) {
  const toIso = (input) => {
    if (!input) return '';
    if (input instanceof Date) return input.toISOString().slice(0, 10);
    return String(input).slice(0, 10);
  };

  return createElement(
    'span',
    { className: twMerge('relative inline-block', className), 'data-testid': dataTestId },
    createElement('input', {
      type: 'date',
      id,
      name,
      value: toIso(value),
      min: toIso(minDate),
      max: toIso(maxDate),
      disabled,
      readOnly,
      'aria-label': ariaLabel,
      'data-testid': dateInputTestId,
      onChange: (event) => {
        const raw = event.target.value;
        onChange?.(raw ? new Date(`${raw}T00:00:00`) : null);
      },
      className: twMerge(
        'h-10 w-full rounded border border-[#c4c9ce] bg-white px-3 text-sm text-[#333333]',
        (disabled || readOnly) && 'opacity-50',
        errorMessage && 'border-[#d70000]',
        inputClassName,
      ),
    }),
    errorMessage
      ? createElement('p', { className: 'm-0 mt-1 text-xs text-[#d70000]' }, errorMessage)
      : null,
  );
}

export function Chip({ label, selected, onClick, disabled, removable, className, dataTestId }) {
  return createElement(
    'button',
    {
      type: 'button',
      disabled,
      'data-testid': dataTestId,
      onClick: () => {
        if (!disabled) onClick?.();
      },
      className: twMerge(
        'inline-flex max-w-64 items-center gap-1.5 rounded-full border border-[#c9c8d4] px-3 py-1 text-sm text-[#333333]',
        selected ? 'bg-[#e4e2ec]' : 'bg-white',
        disabled && 'cursor-default opacity-50',
        className,
      ),
    },
    createElement('span', { className: 'truncate' }, label),
    removable
      ? createElement(
          'span',
          { 'aria-hidden': 'true', className: 'flex shrink-0 items-center' },
          svgIcon(
            [
              createElement('path', {
                key: 'x',
                d: 'M6 6l8 8M14 6l-8 8',
                stroke: 'currentColor',
                strokeWidth: 2,
                strokeLinecap: 'round',
              }),
            ],
            { width: 14, height: 14 },
          ),
        )
      : null,
  );
}

export function Dialog({
  headingProps,
  buttonProps = [],
  visibility,
  onSetVisibility,
  closeButtonIcon = true,
  onHide,
  buttonsPosition = 'row',
  bottomSeparator,
  children,
  dataTestId,
}) {
  if (!visibility) return null;

  const close = () => {
    onSetVisibility?.(false);
    void onHide?.();
  };

  return createElement(
    'div',
    {
      className: 'fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4',
      onClick: (event) => {
        if (event.target === event.currentTarget) close();
      },
    },
    createElement(
      'div',
      {
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': headingProps?.text,
        'data-testid': dataTestId,
        className: 'flex max-h-[85vh] w-full max-w-xl flex-col rounded bg-white shadow-lg',
      },
      createElement(
        'div',
        { className: 'relative shrink-0 px-6 pb-2 pt-6' },
        createElement(
          'h2',
          {
            className: twMerge(
              'm-0 text-xl font-bold text-[#333333]',
              headingProps?.centered && 'text-center',
            ),
          },
          headingProps?.text,
        ),
        closeButtonIcon
          ? createElement(
              'button',
              {
                type: 'button',
                'aria-label': 'Zamknij',
                onClick: close,
                className:
                  'absolute right-4 top-4 flex h-8 w-8 items-center justify-center text-[#333333]',
              },
              svgIcon(
                [
                  createElement('path', {
                    key: 'x',
                    d: 'M5 5l10 10M15 5L5 15',
                    stroke: 'currentColor',
                    strokeWidth: 2,
                    strokeLinecap: 'round',
                  }),
                ],
                { width: 16, height: 16 },
              ),
            )
          : null,
      ),
      createElement('div', { className: 'min-h-0 flex-1 overflow-y-auto px-6 py-4' }, children),
      createElement(
        'div',
        {
          className: twMerge(
            'flex shrink-0 justify-end gap-3 px-6 pb-6 pt-2',
            buttonsPosition === 'column' && 'flex-col',
            bottomSeparator && 'border-t border-[#e0e0e0]',
          ),
        },
        buttonProps.map((props, index) => createElement(Button, { key: index, ...props })),
      ),
    ),
  );
}

export function Skeleton({ width, height, borderRadius = 24, className, dataTestId }) {
  const toSize = (value) => (typeof value === 'number' ? `${value}px` : value);

  return createElement('span', {
    'aria-hidden': 'true',
    'data-testid': dataTestId,
    className: twMerge('inline-block animate-pulse bg-[#e4e4e4]', className),
    style: {
      width: toSize(width),
      height: toSize(height),
      borderRadius: toSize(borderRadius),
    },
  });
}

const LABEL_VARIANT_COLORS = {
  Leaf: { background: '#eef5e8', dot: '#4a7f38', text: '#4a7f38' },
  Minus: { background: '#fbe9e7', dot: '#c0392b', text: '#c0392b' },
  Sky: { background: '#e6f2fb', dot: '#2f7fbf', text: '#2f7fbf' },
  Fuchsia: { background: '#f7e6f3', dot: '#a8317f', text: '#a8317f' },
  Lime: { background: '#f1f8e0', dot: '#7ea62a', text: '#7ea62a' },
  Silver: { background: '#eeeeee', dot: '#7a7a7a', text: '#5a5a5a' },
  Black: { background: '#e6e6e6', dot: '#262626', text: '#262626' },
};

const LABEL_SIZE_TEXT = {
  small: 'text-xs',
  medium: 'text-sm',
  large: 'text-base',
  xl: 'text-lg',
};

export function Label({
  text,
  variant = 'Leaf',
  size = 'small',
  isLoading,
  skeletonProps,
  className,
  dataTestId,
}) {
  if (isLoading) {
    return createElement(Skeleton, {
      width: skeletonProps?.width ?? '100px',
      height: skeletonProps?.height ?? '1.5em',
      className,
      dataTestId,
    });
  }

  const colors = LABEL_VARIANT_COLORS[variant] ?? LABEL_VARIANT_COLORS.Leaf;

  return createElement(
    'span',
    {
      'data-testid': dataTestId,
      className: twMerge(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1',
        LABEL_SIZE_TEXT[size] ?? LABEL_SIZE_TEXT.small,
        className,
      ),
      style: { backgroundColor: colors.background, color: colors.text },
    },
    createElement('span', {
      'aria-hidden': 'true',
      className: 'h-2 w-2 shrink-0 rounded-full',
      style: { backgroundColor: colors.dot },
    }),
    createElement('span', null, text),
  );
}

export function BreadCrumb({ items = [], className, dataTestId }) {
  return createElement(
    'nav',
    {
      'aria-label': 'Breadcrumb',
      className: twMerge('flex flex-wrap items-center gap-2', className),
      'data-testid': dataTestId,
    },
    items.map((item, index) =>
      createElement(
        'span',
        { key: item.label ?? index, className: 'inline-flex items-center gap-2' },
        index > 0
          ? createElement('span', { 'aria-hidden': 'true', className: 'text-[#8a8f98]' }, '→')
          : null,
        createElement(InlineLink, {
          label: item.label,
          url: item.url,
          onClick: item.onClick,
          size: 'small',
        }),
      ),
    ),
  );
}

export function NavigationMenuItem({ mainNode, subNodes = [], rootClassName, listClassName }) {
  return createElement(
    'div',
    { className: rootClassName },
    mainNode,
    subNodes.length > 0
      ? createElement(
          'ul',
          { className: listClassName },
          subNodes.map((node, index) =>
            createElement(
              'li',
              { key: node.label ?? index },
              createElement(
                'button',
                {
                  type: 'button',
                  'aria-current': node.isActive ? 'page' : undefined,
                  onClick: node.onClick,
                  className: twMerge('text-sm', node.isActive ? 'font-bold' : 'underline'),
                },
                node.label,
              ),
            ),
          ),
        )
      : null,
  );
}
