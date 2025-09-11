import { useOutsideClick } from "../hooks/useOutsideClick";

const SideBar = ({ onClose, children }) => {
  const ref = useOutsideClick(() => onClose());

  return (
    <div
      ref={ref}
      className="absolute left-0 w-[400px] h-screen  overflow-scroll bg-[#A9A9A9] z-50 p-7"
    >
      {children}
    </div>
  );
};

export default SideBar;
