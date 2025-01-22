import classnames from "classnames";
import Icons from "./Icon";

function IconButton({
  name,
  styleClass = "",
  size = 36,
  textDown = undefined,
  textHigh = undefined,
  handler,
  visible = true,
}) {
  const textLow = textDown ? (
    <div className="buttonTextDown">{textDown}</div>
  ) : null;
  const textUp = textHigh ? (
    <div className="buttonTextUp">{textHigh}</div>
  ) : null;
  return (
    <button
      onClick={handler}
      className={classnames("button", "flexColumn", styleClass, {
        hide: !visible,
      })}
      id={name}
      aria-label={`Option for ${name}`}
    >
      {textUp}
      <Icons name={name} size={size} />
      {textLow}
    </button>
  );
}

export default IconButton;
