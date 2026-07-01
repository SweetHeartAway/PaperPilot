import { memo } from "react";
import PaperCard from "./PaperCard";
import type { Paper } from "../../types/paper";

export interface PaperListProps {
  papers: Paper[];
}

function PaperListInner({ papers }: PaperListProps) {
  return (
    <div className="space-y-3">
      {papers.map((paper) => (
        <PaperCard key={paper.id} paper={paper} />
      ))}
    </div>
  );
}

export default memo(PaperListInner);
