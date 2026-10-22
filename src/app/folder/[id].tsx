import { Redirect } from "expo-router";

/** Typed compatibility entry for older saved links; the old Draw UI stays disconnected. */
export default function FormerFolderRoute() {
  return <Redirect href="/" />;
}
