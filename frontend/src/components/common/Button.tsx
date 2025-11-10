import { Button as MuiButton, CircularProgress } from '@mui/material';
import type { ButtonProps as MuiButtonProps } from '@mui/material';

interface ButtonProps extends MuiButtonProps {
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ loading, children, disabled, ...props }) => {
  return (
    <MuiButton {...props} disabled={disabled || loading}>
      {loading ? <CircularProgress size={20} color="inherit" /> : children}
    </MuiButton>
  );
};
