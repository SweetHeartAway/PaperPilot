import { memo, type ReactNode } from "react";
import PaperCard from "./PaperCard";
import type { Paper } from "../../types/paper";

export interface PaperListProps {
  papers: Paper[];
  /** 每张卡片右上角的操作区（删除按钮等） */
  renderTopRight?: (paper: Paper) => ReactNode;
}

function PaperListInner({ papers, renderTopRight }: PaperListProps) {
  return (
    <div className="space-y-3">
      {papers.map((paper) => (
        <PaperCard key={paper.id} paper={paper} topRight={renderTopRight?.(paper)} />
      ))}
    </div>
  );
}

export default memo(PaperListInner);
