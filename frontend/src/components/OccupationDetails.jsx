import React from "react";

const OccupationDetails = ({ selectedOccupation, setSelectedOccupation }) => {
  return (
    <>
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {selectedOccupation?.label}
        </h2>
        <button
          onClick={() => setSelectedOccupation(null)}
          className="p-2 rounded-full hover:bg-gray-200 transition"
        >
          <p
            onClick={() => setSelectedOccupation(null)}
            className="w-6 h-6 text-gray-600"
          >
            X
          </p>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <p className="text-gray-700 leading-relaxed">
          {selectedOccupation?.description || "No description available."}
        </p>
      </div>
    </>
  );
};

export default OccupationDetails;
