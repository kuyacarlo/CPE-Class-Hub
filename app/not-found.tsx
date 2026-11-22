import Link from "next/link";
import Plate from "@/components/Plate";

export default function NotFound() {
  return (
    <Plate title="Page not found" actions={<><Link className="btn p" href="/">Go to the schedule</Link><Link href="/courses">All courses</Link></>}>
      <p>That page doesn&apos;t exist, or it moved. Check the link, or start from the schedule.</p>
    </Plate>
  );
}
