import { useOutsideClick } from "../hooks/useOutSideClick";

const SideBar = ({ onClose, children }) => {
  const ref = useOutsideClick(() => onClose());

  return (
    <div
      ref={ref}
      className="absolute left-0 w-[400px] h-screen  overflow-scroll bg-gray-400 z-50 p-7"
    >
      {children}
    </div>
  );
};

export default SideBar;
