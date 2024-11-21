import { cn } from "@/lib/utils"; // Assuming you have a utility function for classnames

const SpinningWheel = ({ size = 50, color = "currentColor", className = "" }   ) => {
  const wheelClasses = cn(
    "border-t-4 border-solid border-blue-500 rounded-full animate-spin",
    className
  );

  return (
    <div
      className={wheelClasses}
      style={{
        width: size,
        height: size,
        borderTopColor: color,
      }}
    ></div>
  );
};

 
SpinningWheel.defaultProps = {
  size: "32px",
  color: "currentColor",
  className: "",
};

export default SpinningWheel;