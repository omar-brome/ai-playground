type NodeState = 'available' | 'booked' | 'pending'

type Props = {
  x: number
  y: number
  label: string
  state: NodeState
  selected: boolean
  onSelect: () => void
  tooltip?: string
  fillColor?: string
}

const fills: Record<NodeState, string> = {
  available: '#00d96d',
  booked: '#ef4444',
  pending: '#facc15',
}

export function PositionNode({ x, y, label, state, selected, onSelect, tooltip, fillColor }: Props) {
  return (
    <g onClick={state === 'available' ? onSelect : undefined} style={{ cursor: state === 'available' ? 'pointer' : 'not-allowed' }}>
      <circle
        cx={x}
        cy={y}
        r={5.5}
        fill={fillColor ?? fills[state]}
        stroke={selected ? '#3b82f6' : '#ffffff'}
        strokeWidth={selected ? 1.8 : 1}
      />
      <circle cx={x} cy={y} r={8} fill="transparent" />
      <text x={x} y={y + 10} textAnchor="middle" fill="white" fontSize="3.4">
        {label}
      </text>
      {tooltip ? <title>{tooltip}</title> : null}
    </g>
  )
}
