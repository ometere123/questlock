import {
  aggregateQuestAnalytics,
  potentialOutflowRemaining,
} from "../../lib/analytics";

describe("aggregateQuestAnalytics", () => {
  test("empty input yields zero everything and null rates", () => {
    const a = aggregateQuestAnalytics([]);
    expect(a.total_submissions).toBe(0);
    expect(a.passed).toBe(0);
    expect(a.failed).toBe(0);
    expect(a.approved_onchain).toBe(0);
    expect(a.claimable).toBe(0);
    expect(a.claimed).toBe(0);
    expect(a.average_score).toBeNull();
    expect(a.approval_conversion_rate).toBeNull();
    expect(a.claim_conversion_rate).toBeNull();
    expect(a.top_failure_reasons).toEqual([]);
  });

  test("happy mix: counts statuses, computes both conversion rates", () => {
    const a = aggregateQuestAnalytics([
      { status: "FAILED",           score: 50, failure_reasons_json: ["No README"] },
      { status: "FAILED",           score: 40, failure_reasons_json: ["No README"] },
      { status: "PASSED",           score: 80, failure_reasons_json: [] },
      { status: "APPROVED_ONCHAIN", score: 85, failure_reasons_json: [] },
      { status: "CLAIMED",          score: 95, failure_reasons_json: [] },
    ]);
    expect(a.total_submissions).toBe(5);
    expect(a.failed).toBe(2);
    expect(a.passed).toBe(3); // PASSED + APPROVED_ONCHAIN + CLAIMED
    expect(a.approved_onchain).toBe(2); // APPROVED_ONCHAIN + CLAIMED
    expect(a.claimed).toBe(1);
    expect(a.claimable).toBe(1); // approved - claimed
    expect(a.average_score).toBe(70);
    // approval rate = 2/5 = 0.4; claim rate = 1/2 = 0.5
    expect(a.approval_conversion_rate).toBeCloseTo(0.4, 5);
    expect(a.claim_conversion_rate).toBeCloseTo(0.5, 5);
  });

  test("top failure reasons are sorted and capped at 5", () => {
    const submissions = Array.from({ length: 30 }, (_, i) => {
      const reasons =
        i % 3 === 0
          ? ["No README"]
          : i % 3 === 1
          ? ["No demo URL", "Short README"]
          : ["No frontend files"];
      return {
        status: "FAILED",
        score: 30,
        failure_reasons_json: reasons,
      };
    });
    const a = aggregateQuestAnalytics(submissions);
    expect(a.top_failure_reasons.length).toBeLessThanOrEqual(5);
    expect(a.top_failure_reasons[0].count).toBeGreaterThanOrEqual(
      a.top_failure_reasons[a.top_failure_reasons.length - 1].count
    );
  });

  test("ignores non-array failure_reasons_json safely", () => {
    const a = aggregateQuestAnalytics([
      { status: "FAILED", score: 10, failure_reasons_json: null },
      { status: "FAILED", score: 20, failure_reasons_json: "not an array" },
      { status: "FAILED", score: 30, failure_reasons_json: undefined },
    ]);
    expect(a.failed).toBe(3);
    expect(a.top_failure_reasons).toEqual([]);
  });

  test("in_progress bucket counts pre-PASSED states (e.g. EVALUATING)", () => {
    const a = aggregateQuestAnalytics([
      { status: "SUBMITTED",      score: null, failure_reasons_json: [] },
      { status: "FETCHING_PROOF", score: null, failure_reasons_json: [] },
      { status: "EVALUATING",     score: null, failure_reasons_json: [] },
      // ATTESTING already passed the scoring gate, so it does NOT count as
      // in_progress — it counts as passed.
      { status: "ATTESTING",      score: 80,   failure_reasons_json: [] },
      { status: "PASSED",         score: 80,   failure_reasons_json: [] },
    ]);
    expect(a.in_progress).toBe(3);
    expect(a.passed).toBe(2);
  });
});

describe("potentialOutflowRemaining", () => {
  test("computes remaining slots * reward", () => {
    expect(
      potentialOutflowRemaining({ maxClaims: 100, totalClaims: 10, rewardAmount: "10" })
    ).toBe("900");
  });
  test("zero when maxed out", () => {
    expect(
      potentialOutflowRemaining({ maxClaims: 5, totalClaims: 5, rewardAmount: "10" })
    ).toBe("0");
  });
  test("clamps to zero when overdrawn (defensive)", () => {
    expect(
      potentialOutflowRemaining({ maxClaims: 5, totalClaims: 10, rewardAmount: "10" })
    ).toBe("0");
  });
});
