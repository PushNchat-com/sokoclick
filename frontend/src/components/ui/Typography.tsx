import React from 'react';

export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
export type TextVariant = 'body-lg' | 'body-md' | 'body-sm' | 'body-xs' | 'caption' | 'overline';

export interface HeadingProps {
  level: HeadingLevel;
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export interface TextProps {
  variant?: TextVariant;
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

/**
 * Heading component for consistent typography
 * 
 * @example
 * <Heading level="h1">Page Title</Heading>
 * <Heading level="h2" className="text-center">Section Title</Heading>
 */
export const Heading: React.FC<HeadingProps> = ({
  level,
  children,
  className = '',
  as,
}) => {
  const Component = as || level;
  
  const classes = [
    level,
    className,
  ].filter(Boolean).join(' ');

  return (
    <Component className={classes}>
      {children}
    </Component>
  );
};

/**
 * Text component for consistent typography
 * 
 * @example
 * <Text>Default body text</Text>
 * <Text variant="body-lg">Larger body text</Text>
 * <Text variant="caption">Caption text</Text>
 */
export const Text: React.FC<TextProps> = ({
  variant = 'body-md',
  children,
  className = '',
  as: Component = 'p',
}) => {
  const classes = [
    variant,
    className,
  ].filter(Boolean).join(' ');

  return (
    <Component className={classes}>
      {children}
    </Component>
  );
};

/**
 * Helper shorthand components for specific heading levels
 */
export const H1: React.FC<Omit<HeadingProps, 'level'>> = (props) => (
  <Heading level="h1" {...props} />
);

export const H2: React.FC<Omit<HeadingProps, 'level'>> = (props) => (
  <Heading level="h2" {...props} />
);

export const H3: React.FC<Omit<HeadingProps, 'level'>> = (props) => (
  <Heading level="h3" {...props} />
);

export const H4: React.FC<Omit<HeadingProps, 'level'>> = (props) => (
  <Heading level="h4" {...props} />
);

export const H5: React.FC<Omit<HeadingProps, 'level'>> = (props) => (
  <Heading level="h5" {...props} />
);

export const H6: React.FC<Omit<HeadingProps, 'level'>> = (props) => (
  <Heading level="h6" {...props} />
); 