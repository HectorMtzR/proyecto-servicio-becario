"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export interface StudentNoProgressData {
  assignmentId:   string;
  studentName:    string;
  studentEmail:   string;
  matricula:      string;
  careerName:     string;
  supervisorName: string;
  scholarshipType: string;
  isVoluntario:   boolean;
  daysElapsed:    number;
}

export async function getStudentsWithNoProgress(
  role: "ADMIN" | "JEFE_SERVICIO",
): Promise<StudentNoProgressData[]> {
  const session = await auth();
  if (!session?.user) return [];

  const assignments = await db.assignment.findMany({
    where: {
      accumulatedMinutes: 0,
      isActive:           true,
      period:             { isActive: true, isClosed: false },
      ...(role === "JEFE_SERVICIO" ? { supervisorId: session.user.id } : {}),
    },
    include: {
      student: {
        include: {
          studentProfile: { include: { career: true } },
        },
      },
      supervisor: true,
      period:     true,
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();

  return assignments
    .filter((a) => a.student.studentProfile !== null)
    .map((a) => {
      const profile       = a.student.studentProfile!;
      const daysElapsed   = Math.max(
        0,
        Math.floor((now.getTime() - a.period.startDate.getTime()) / (1000 * 60 * 60 * 24)),
      );
      const scholarshipType = profile.scholarshipType;
      return {
        assignmentId:   a.id,
        studentName:    a.student.name,
        studentEmail:   a.student.email,
        matricula:      profile.studentId,
        careerName:     profile.career.name,
        supervisorName: a.supervisor.name,
        scholarshipType,
        isVoluntario:   scholarshipType === "SEP",
        daysElapsed,
      };
    });
}
