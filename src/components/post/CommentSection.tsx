"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { getComments, addComment, deleteComment } from "@/lib/queries/comments";
import { Comment } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CommentSectionProps {
  postId: string;
  currentUserId: string;
}

export function CommentSection({ postId, currentUserId }: CommentSectionProps) {
  const [supabase] = useState(() => createClient());
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getComments(supabase, postId).then((data) => {
      setComments(data);
      setLoading(false);
    });
  }, [postId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const comment = await addComment(supabase, {
        postId,
        authorId: currentUserId,
        content: newComment.trim(),
      });
      setComments((prev) => [...prev, comment]);
      setNewComment("");
    } catch {
      toast.error("댓글 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(supabase, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      toast.error("댓글 삭제에 실패했습니다.");
    }
  };

  return (
    <div className="mt-8">
      <h3 className="font-semibold mb-4">댓글 {comments.length}개</h3>

      <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="댓글을 입력하세요..."
          maxLength={500}
          rows={2}
          className="flex-1 resize-none"
        />
        <Button type="submit" disabled={submitting || !newComment.trim()} className="self-end">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "등록"}
        </Button>
      </form>

      {loading ? (
        <div className="py-8 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          첫 댓글을 남겨보세요!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarImage src={comment.profiles?.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">
                  {comment.profiles?.display_name?.slice(0, 2) ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">
                    {comment.profiles?.display_name ?? "알 수 없음"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(comment.created_at)}
                  </span>
                </div>
                <p className="text-sm mt-0.5 whitespace-pre-wrap break-words">{comment.content}</p>
              </div>
              {comment.author_id === currentUserId && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="댓글 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
