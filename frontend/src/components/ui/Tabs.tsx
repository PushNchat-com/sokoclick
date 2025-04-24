import React, { createContext, useContext, useState } from 'react';
import { twMerge } from 'tailwind-merge';

// Create a context for tabs to share state
type TabsContextType = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = createContext<TabsContextType | undefined>(undefined);

// Custom hook to use tabs context
const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs component');
  }
  return context;
};

interface TabsProps {
  /**
   * The value of the currently selected tab
   */
  value?: string;
  
  /**
   * The default value of the tabs
   */
  defaultValue?: string;
  
  /**
   * Callback function called when the selected tab changes
   */
  onValueChange?: (value: string) => void;
  
  /**
   * The content of the tabs
   */
  children: React.ReactNode;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  value,
  defaultValue,
  onValueChange = () => {},
  children,
  className,
}) => {
  const [selectedValue, setSelectedValue] = useState(value || defaultValue || '');
  
  // Use controlled or uncontrolled pattern
  const currentValue = value !== undefined ? value : selectedValue;
  
  const handleValueChange = (newValue: string) => {
    if (value === undefined) {
      setSelectedValue(newValue);
    }
    onValueChange(newValue);
  };
  
  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={twMerge('w-full', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

interface TabsListProps {
  /**
   * The content of the tabs list
   */
  children: React.ReactNode;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const TabsList: React.FC<TabsListProps> = ({ children, className }) => {
  return (
    <div className={twMerge('flex space-x-1 rounded-md bg-gray-100 p-1', className)} role="tablist">
      {children}
    </div>
  );
};

interface TabsTriggerProps {
  /**
   * The value of the tab
   */
  value: string;
  
  /**
   * The content of the tab trigger
   */
  children: React.ReactNode;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Disabled state
   */
  disabled?: boolean;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  children,
  className,
  disabled = false,
}) => {
  const { value: selectedValue, onValueChange } = useTabsContext();
  const isSelected = selectedValue === value;
  
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      disabled={disabled}
      className={twMerge(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isSelected
          ? 'bg-white text-indigo-700 shadow-sm'
          : 'text-gray-700 hover:bg-gray-200',
        className
      )}
      onClick={() => onValueChange(value)}
    >
      {children}
    </button>
  );
};

interface TabsContentProps {
  /**
   * The value of the tab content
   */
  value: string;
  
  /**
   * The content
   */
  children: React.ReactNode;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const TabsContent: React.FC<TabsContentProps> = ({
  value,
  children,
  className,
}) => {
  const { value: selectedValue } = useTabsContext();
  const isSelected = selectedValue === value;
  
  if (!isSelected) return null;
  
  return (
    <div 
      role="tabpanel" 
      className={twMerge('mt-2', className)}
      tabIndex={0}
    >
      {children}
    </div>
  );
}; 