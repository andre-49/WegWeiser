import { FaPhoenixFramework } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import { FaSearch } from "react-icons/fa";
import { IoIosNotifications } from "react-icons/io";

const Header = () => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center p-4 bg-gray-200">
      <div className="flex items-center space-x-2 mb-2 md:mb-0">
        <FaPhoenixFramework size={70} />
        <span className="text-xl md:text-xl font-montserrat font-bold">
          WEGWEISER
        </span>
      </div>
      <div className="flex flex-col md:flex-row w-full md:w-1/3 my-2 md:my-0 space-y-2 md:space-y-0 md:space-x-2">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search skills or occupation..."
            className="rounded-lg border border-gray-300 p-2 pl-10 w-full"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        <button className="px-5 py-2 bg-teal-400 hover:bg-gray-300 rounded-lg w-full md:w-auto">
          Search
        </button>
      </div>
      <div className="flex flex-row space-x-8 font-montserrat mt-2 md:mt-0">
        <div className="flex flex-row space-x-2 items-center">
          <button>
            <IoIosNotifications size={30} />
          </button>
        </div>
        <div className="flex flex-row space-x-2 items-center">
          <CgProfile size={24} />
          <button>Sign Up</button>
        </div>
      </div>
    </div>
  );
};

export default Header;
