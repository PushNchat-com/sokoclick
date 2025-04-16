import React from 'react';

export interface CardProps {
  variant?: 'default' | 'hover' | 'bordered';
  children: React.ReactNode;
  className?: string;
}

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Card component following the SokoClick design system
 * 
 * @example
 * <Card>
 *   <CardHeader>Header Content</CardHeader>
 *   <CardBody>Main Content</CardBody>
 *   <CardFooter>Footer Content</CardFooter>
 * </Card>
 */
const Card: React.FC<CardProps> = ({
  variant = 'default',
  children,
  className = '',
}) => {
  const variantClasses = {
    default: 'card',
    hover: 'card-hover',
    bordered: 'card-bordered',
  };

  const classes = [
    variantClasses[variant],
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = '',
}) => {
  const classes = [
    'card-header',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {children}
    </div>
  );
};

export const CardBody: React.FC<CardBodyProps> = ({
  children,
  className = '',
}) => {
  const classes = [
    'card-body',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
}) => {
  const classes = [
    'card-footer',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {children}
    </div>
  );
};

export default Card; 