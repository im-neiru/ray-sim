type ConvexMirrorProps = {
  cx: number;
  cy: number;
  r: number;
  angle: number;
};

export function Mirror(props: ConvexMirrorProps) {
  return <polygon class="mirror" points={points} />;
}
