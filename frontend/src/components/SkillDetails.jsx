function SkillDetails({ selectedSkill, onClose }) {
  if (!selectedSkill) return null;

  const skillData = selectedSkill.nodeData || {};
  const occupation = selectedSkill.occupation || [];
  console.log(selectedSkill);

  //   console.log(selectedSkill);

  return (
    <div className="p-1 h-full w-full bg-white overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-red-500">
        <h2 className="text-2xl font-bold text-red-600 leading-tight pr-4">
          {selectedSkill.label || "Skill Details"}
        </h2>
        <button
          onClick={onClose}
          aria-label="Close skill details"
          className="text-gray-500 hover:text-gray-700 text-2xl leading-none p-1 hover:bg-gray-100 rounded transition-colors"
        >
          ×
        </button>
      </div>

      {/* Description */}
      {selectedSkill.description && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Description
          </h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-gray-700 leading-relaxed">
              {selectedSkill.description}
            </p>
          </div>
        </div>
      )}

      {/* Related Occupations */}
      {/* {occupation.length > 0 && ( */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Related Occupations
        </h3>
        <div className="grid gap-3">
          {occupation.map((occ, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3 hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-green-800 font-medium">{occ}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* )} */}

      {/* Additional Metadata */}
      {(skillData.code || skillData.group_code || skillData.type) && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Metadata</h3>
          <div className="space-y-3">
            {skillData.type && (
              <div className="flex justify-between bg-gray-50 rounded-lg py-2 px-3">
                <span className="text-gray-600 font-medium">Type:</span>
                <span className="text-gray-800">{skillData.type}</span>
              </div>
            )}
            {skillData.code && (
              <div className="flex justify-between bg-gray-50 rounded-lg py-2 px-3">
                <span className="text-gray-600 font-medium">Code:</span>
                <span className="text-gray-800">{skillData.code}</span>
              </div>
            )}
            {skillData.group_code && (
              <div className="flex justify-between bg-gray-50 rounded-lg py-2 px-3">
                <span className="text-gray-600 font-medium">Group Code:</span>
                <span className="text-gray-800">{skillData.group_code}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Skills Network Info */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Skills Network
        </h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-700 text-sm">
            Click on occupation nodes to explore related skills and discover how
            they connect in the broader skills ecosystem.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SkillDetails;
