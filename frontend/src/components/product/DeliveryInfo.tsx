import React from "react";

interface DeliveryOption {
  type: string;
  price: number;
  estimatedDelivery: string;
}

interface DeliveryInfoProps {
  options: DeliveryOption[];
  location?: string;
  className?: string;
}

const DeliveryInfo: React.FC<DeliveryInfoProps> = ({
  options,
  location,
  className = "",
}) => {
  return (
    <div className={`rounded-lg border border-gray-200 p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Delivery Information</h3>

      {location && (
        <div className="flex items-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5 text-gray-500 mr-2"
          >
            <path
              fillRule="evenodd"
              d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm text-gray-700">Ships from {location}</span>
        </div>
      )}

      {options.length > 0 ? (
        <ul className="space-y-3">
          {options.map((option, index) => (
            <li
              key={index}
              className="flex justify-between items-center p-3 rounded-md border border-gray-100 hover:bg-gray-50"
            >
              <div>
                <p className="font-medium text-gray-900">{option.type}</p>
                <p className="text-sm text-gray-500">
                  {option.estimatedDelivery}
                </p>
              </div>
              <div className="text-right">
                {option.price === 0 ? (
                  <span className="text-green-600 font-medium">Free</span>
                ) : (
                  <span className="font-medium">
                    ${option.price.toFixed(2)}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 text-sm">No delivery options available</p>
      )}

      <p className="mt-4 text-xs text-gray-500">
        * Actual delivery times may vary based on shipping address and carrier
        conditions
      </p>
    </div>
  );
};

export default DeliveryInfo;
