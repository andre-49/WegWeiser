import { FaPhoenixFramework } from "react-icons/fa";
import { FaSearch } from "react-icons/fa";
import profile from "./../assets/profile.png";
import { useState, useEffect } from "react";
import axios from "axios";
import Fuse from "fuse.js";

const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [nodes, setNodes] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [fuse, setFuse] = useState(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    // Fetch nodes from backend
    const fetchNodes = async () => {
      try {
        const response = await axios.get("http://localhost:8000/nodes");
        const nodesData = response.data.nodes;
        setNodes(nodesData);

        // Initialize Fuse for fuzzy search
        const fuseInstance = new Fuse(nodesData, {
          keys: ["title", "description"],
          threshold: 0.3, // Lower threshold for more lenient matching
          includeScore: true,
        });
        setFuse(fuseInstance);
      } catch (error) {
        console.error("Error fetching nodes:", error);
      }
    };

    fetchNodes();
  }, []);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === "") {
      setFilteredResults([]);
      setShowResults(false);
      return;
    }

    if (fuse) {
      const results = fuse.search(query);
      // Limit results to top 10 for better UX
      setFilteredResults(results.slice(0, 10));
      setShowResults(true);
    }
  };

  const handleResultClick = (result) => {
    setSearchQuery(result.item.title);
    setShowResults(false);
    // Here you could add logic to navigate to the selected item or perform other actions
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-center p-4 text-white">
      <div className="flex items-center space-x-2 mb-2 md:mb-0">
        <FaPhoenixFramework size={70} />
        <div
          className="relative inline-block"
          style={{ fontFamily: "cursive" }}
        >
          <span className="text-xl md:text-2xl font-bold tracking-wider drop-shadow-sm">
            <span className="text-3xl font-normal">W</span>
            <span>EG</span>
            <span className="text-3xl font-normal">W</span>
            <span className="text-3xl font-normal">EISER</span>
          </span>
        </div>
      </div>
      <div className="flex flex-col md:flex-row w-full md:w-1/3 my-2 md:my-0 space-y-2 md:space-y-0 md:space-x-2">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search skills or occupation..."
            className="rounded-4xl border border-gray-300 p-2 pl-10 w-full"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)} // Delay to allow click on results
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />

          {/* Search Results Dropdown */}
          {showResults && filteredResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto z-50 shadow-lg">
              {filteredResults.map((result, index) => (
                <div
                  key={index}
                  className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="font-medium text-gray-900">
                    {result.item.title}
                  </div>
                  {result.item.description && (
                    <div className="text-sm text-gray-600 truncate">
                      {result.item.description}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 capitalize">
                    {result.item.type}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results Message */}
          {showResults && searchQuery && filteredResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 p-3 z-50 shadow-lg">
              <div className="text-gray-500 text-sm">
                No results found for "{searchQuery}"
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-row space-x-8 font-montserrat mt-2 md:mt-0">
          <div className="flex flex-row space-x-2 items-center">
            <img src={profile} alt="Profile" className="w-8 h-8 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
