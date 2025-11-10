import { Chip } from '@mui/material';
import { STATUS_COLORS } from '../../config/constants';

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#6B7280';

  return (
    <Chip
      label={label || status.replace('_', ' ').toUpperCase()}
      size="small"
      sx={{
        backgroundColor: color,
        color: '#ffffff',
        fontWeight: 500,
        textTransform: 'capitalize',
      }}
    />
  );
};
