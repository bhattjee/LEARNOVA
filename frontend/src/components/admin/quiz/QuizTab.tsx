import { QuizList } from "./QuizList";

interface QuizTabProps {
  courseId: string;
}

export function QuizTab({ courseId }: QuizTabProps) {
  return <QuizList courseId={courseId} />;
}
