import {
  getActiveWorkSession,
  getCurrentAssignment,
} from "@/actions/cronometro";
import { getAlumnoStats, getRecentSessions } from "@/actions/jornadas";
import Cronometro from "@/components/cronometro/Cronometro";
import AssignmentCard from "@/components/cronometro/AssignmentCard";
import ProgressWidget from "@/components/cronometro/ProgressWidget";
import RecentActivity from "@/components/cronometro/RecentActivity";
export const dynamic = "force-dynamic";

export default async function AlumnoJornadasPage() {
  const [activeSession, assignment, stats, sessions] = await Promise.all([
    getActiveWorkSession(),
    getCurrentAssignment(),
    getAlumnoStats(),
    getRecentSessions(),
  ]);

  return (
    <div className="px-8 pb-12 pt-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="grid grid-cols-12 gap-8">
          <Cronometro
            initialActive={activeSession}
            hasAssignment={assignment !== null}
          />
          <AssignmentCard assignment={assignment} />
          <ProgressWidget stats={stats} />
          <RecentActivity sessions={sessions} />
        </div>
      </div>
    </div>
  );
}
