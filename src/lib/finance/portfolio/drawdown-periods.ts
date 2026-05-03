import type {
  CurrentDrawdownStatus,
  DrawdownAnalysis,
  DrawdownEpisode,
  PortfolioPerformancePoint,
} from "@/lib/finance/portfolio/types";

const RECOVERY_TOLERANCE = 1e-10;

type WorkingEpisode = Omit<
  DrawdownEpisode,
  "rank" | "endDate" | "recoveryDate" | "lengthDays" | "recoveryDays" | "underwaterDays" | "recoveryBalance"
> & {
  peakBalance: number;
};

export function buildDrawdownAnalysis(
  points: PortfolioPerformancePoint[],
  limit: number = 10,
): DrawdownAnalysis {
  const sanitizedPoints = points.filter(
    (point) =>
      point.date &&
      Number.isFinite(point.balance) &&
      point.balance > 0,
  );

  if (sanitizedPoints.length < 2) {
    return buildEmptyDrawdownAnalysis();
  }

  const episodes: DrawdownEpisode[] = [];
  let runningPeakBalance = sanitizedPoints[0].balance;
  let activeEpisode: WorkingEpisode | null = null;

  for (let index = 1; index < sanitizedPoints.length; index += 1) {
    const point = sanitizedPoints[index];
    const drawdown = point.balance / runningPeakBalance - 1;
    const isRecovered = point.balance >= runningPeakBalance - RECOVERY_TOLERANCE;

    if (isRecovered) {
      if (activeEpisode) {
        episodes.push(
          completeEpisode({
            episode: activeEpisode,
            endPoint: point,
            recoveryDate: point.date,
            recoveryBalance: point.balance,
          }),
        );
        activeEpisode = null;
      }

      if (point.balance > runningPeakBalance) {
        runningPeakBalance = point.balance;
      }

      continue;
    }

    if (!activeEpisode) {
      activeEpisode = {
        startDate: point.date,
        troughDate: point.date,
        maxDrawdown: drawdown,
        startBalance: point.balance,
        troughBalance: point.balance,
        peakBalance: runningPeakBalance,
      };
      continue;
    }

    if (drawdown < activeEpisode.maxDrawdown) {
      activeEpisode.troughDate = point.date;
      activeEpisode.troughBalance = point.balance;
      activeEpisode.maxDrawdown = drawdown;
    }
  }

  const lastPoint = sanitizedPoints[sanitizedPoints.length - 1];

  if (activeEpisode) {
    episodes.push(
      completeEpisode({
        episode: activeEpisode,
        endPoint: lastPoint,
        recoveryDate: null,
        recoveryBalance: null,
      }),
    );
  }

  const rankedAllEpisodes = episodes
    .sort((left, right) => left.maxDrawdown - right.maxDrawdown)
    .map((episode, index) => ({
      ...episode,
      rank: index + 1,
    }));
  const rankedEpisodes = rankedAllEpisodes.slice(0, Math.max(limit, 0));
  const longestUnderwater = rankedAllEpisodes.reduce<DrawdownEpisode | null>(
    (selected, episode) => {
      if (!selected || episode.underwaterDays > selected.underwaterDays) {
        return episode;
      }

      return selected;
    },
    null,
  );

  return {
    episodes: rankedEpisodes,
    worstDrawdown: rankedEpisodes[0] ?? null,
    longestUnderwater,
    currentStatus: buildCurrentDrawdownStatus(sanitizedPoints),
  };
}

function completeEpisode(input: {
  episode: WorkingEpisode;
  endPoint: PortfolioPerformancePoint;
  recoveryDate: string | null;
  recoveryBalance: number | null;
}): DrawdownEpisode {
  const { episode, endPoint, recoveryDate, recoveryBalance } = input;

  return {
    rank: 0,
    startDate: episode.startDate,
    troughDate: episode.troughDate,
    endDate: recoveryDate ?? endPoint.date,
    recoveryDate,
    lengthDays: getCalendarDaySpan(episode.startDate, episode.troughDate),
    recoveryDays:
      recoveryDate === null
        ? null
        : getCalendarDaySpan(episode.troughDate, recoveryDate),
    underwaterDays: getCalendarDaySpan(episode.startDate, recoveryDate ?? endPoint.date),
    maxDrawdown: Number.isFinite(episode.maxDrawdown) ? episode.maxDrawdown : 0,
    startBalance: episode.startBalance,
    troughBalance: episode.troughBalance,
    recoveryBalance,
  };
}

function buildCurrentDrawdownStatus(
  points: PortfolioPerformancePoint[],
): CurrentDrawdownStatus {
  let runningPeakBalance = points[0].balance;
  let underwaterStartDate: string | null = null;

  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];

    if (point.balance >= runningPeakBalance - RECOVERY_TOLERANCE) {
      runningPeakBalance = Math.max(runningPeakBalance, point.balance);
      underwaterStartDate = null;
      continue;
    }

    if (underwaterStartDate === null) {
      underwaterStartDate = point.date;
    }
  }

  const latestPoint = points[points.length - 1];
  const currentDrawdown = latestPoint.balance / runningPeakBalance - 1;
  const isRecovered = Math.abs(currentDrawdown) <= RECOVERY_TOLERANCE;

  return {
    isRecovered,
    currentDrawdown: isRecovered ? 0 : currentDrawdown,
    underwaterDays:
      underwaterStartDate === null
        ? 0
        : getCalendarDaySpan(underwaterStartDate, latestPoint.date),
    startDate: underwaterStartDate,
  };
}

function buildEmptyDrawdownAnalysis(): DrawdownAnalysis {
  return {
    episodes: [],
    worstDrawdown: null,
    longestUnderwater: null,
    currentStatus: {
      isRecovered: true,
      currentDrawdown: 0,
      underwaterDays: 0,
      startDate: null,
    },
  };
}

function getCalendarDaySpan(startDate: string, endDate: string): number {
  const startTime = Date.parse(`${startDate}T00:00:00Z`);
  const endTime = Date.parse(`${endDate}T00:00:00Z`);

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
    return 0;
  }

  return Math.max(0, Math.round((endTime - startTime) / 86400000));
}
