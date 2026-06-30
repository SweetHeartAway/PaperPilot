import PaperCard from "./PaperCard";
import type { Paper } from "../../types/paper";

export interface PaperListProps {
  papers: Paper[];
}

export default function PaperList({ papers }: PaperListProps) {
  return (
    <div className="space-y-3">
      {papers.map((paper) => (
        <PaperCard key={paper.id} paper={paper} />
      ))}
    </div>
  );
}
