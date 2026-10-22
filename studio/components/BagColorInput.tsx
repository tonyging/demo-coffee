import type { StringInputProps } from 'sanity';
import { set } from 'sanity';

type Opt = { title: string; value: string };

/** 袋子顏色：色票選擇（取代文字單選），顏色清單來自欄位的 options.list */
export function BagColorInput(props: StringInputProps) {
  const list = ((props.schemaType.options as { list?: Opt[] } | undefined)?.list ?? []) as Opt[];
  return (
    <div role="group" aria-label="袋子顏色" style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {list.map((o) => {
        const on = props.value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            title={o.title}
            aria-label={o.title}
            aria-pressed={on}
            disabled={props.readOnly}
            onClick={() => props.onChange(set(o.value))}
            style={{
              all: 'unset',
              boxSizing: 'border-box',
              cursor: props.readOnly ? 'default' : 'pointer',
              width: 56,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
            }}
          >
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: o.value,
                boxShadow: on ? 'inset 0 0 0 1px color-mix(in srgb, currentColor 70%, transparent), 0 0 0 2px var(--card-bg-color, #fff), 0 0 0 4px currentColor' : 'inset 0 0 0 1px color-mix(in srgb, currentColor 70%, transparent)',
              }}
            />
            <span style={{ fontWeight: on ? 700 : 400 }}>{o.title}</span>
          </button>
        );
      })}
    </div>
  );
}
