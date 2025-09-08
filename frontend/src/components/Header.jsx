import { FaPhoenixFramework } from "react-icons/fa";
import { FaSearch } from "react-icons/fa";
// import profile from "./../assets/profile.png";
const Header = () => {
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
            <span className="">EISER</span>
          </span>
        </div>
      </div>
      <div className="flex flex-col md:flex-row w-full md:w-1/3 my-2 md:my-0 space-y-2 md:space-y-0 md:space-x-2">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search skills or occupation..."
            className="rounded-4xl border border-gray-300 p-2 pl-10 w-full"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        <div className="flex flex-row space-x-8 font-montserrat mt-2 md:mt-0">
          <div className="flex flex-row space-x-2 items-center">
            <img src="" alt="Profile" className="w-8 h-8 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
