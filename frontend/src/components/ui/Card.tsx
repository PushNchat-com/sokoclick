import React from "react";
import { twMerge } from "tailwind-merge";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Card: React.FC<CardProps> = ({ className, ...props }) => (
  <div
    className={twMerge(
      "rounded-lg border border-gray-200 bg-white shadow-sm",
      className,
    )}
    {...props}
  />
);

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  className,
  ...props
}) => (
  <div
    className={twMerge("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
);

export interface CardTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({
  className,
  ...props
}) => (
  <h3
    className={twMerge(
      "text-xl font-semibold leading-none tracking-tight",
      className,
    )}
    {...props}
  />
);

export interface CardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string;
}

export const CardDescription: React.FC<CardDescriptionProps> = ({
  className,
  ...props
}) => <p className={twMerge("text-sm text-gray-500", className)} {...props} />;

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({
  className,
  ...props
}) => <div className={twMerge("p-6 pt-0", className)} {...props} />;

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  className,
  ...props
}) => (
  <div
    className={twMerge("flex items-center p-6 pt-0", className)}
    {...props}
  />
);

// ProductCard specific component (based on Card)
interface ProductCardProps {
  title: string;
  price: number;
  imageUrl: string;
  onClick?: () => void;
  className?: string;
  badges?: React.ReactNode[];
}

const ProductCard: React.FC<ProductCardProps> = ({
  title,
  price,
  imageUrl,
  onClick,
  className = "",
  badges,
}) => {
  return (
    <Card
      className={twMerge(
        "flex flex-col h-full overflow-hidden shadow-md hover:shadow-lg",
        className,
      )}
      onClick={onClick}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        {badges && badges.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {badges.map((badge, index) => (
              <React.Fragment key={index}>{badge}</React.Fragment>
            ))}
          </div>
        )}
      </div>
      <div className="p-3 flex-grow flex flex-col">
        <h3 className="text-base font-medium mb-1 line-clamp-2">{title}</h3>
        <div className="mt-auto">
          <p className="text-lg font-bold text-green-600">
            {typeof price === "number" ? `₦${price.toLocaleString()}` : price}
          </p>
        </div>
      </div>
    </Card>
  );
};

export { ProductCard };
export type { ProductCardProps };
