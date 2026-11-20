import { describe, it, expect } from 'vitest';
import { isScheduleCompletedForNextDate } from '../../../src/modules/TodayPlan/todayplan.api';

describe('isScheduleCompletedForNextDate', () => {
  const masterSchedules = [
    {
      schId: 100,
      schStatus: 3, // Completed
      schCompDate: '2026-11-17',
    },
    {
      schId: 200,
      schStatus: 1, // In Progress (Not completed)
      schCompDate: null,
    },
  ];

  it('displays assigned details on the completed date itself', () => {
    const plan = {
      Sch_Id: '100',
      Task_Assign_dt: '2026-11-17',
    };

    // Viewing on the completed date (2026-11-17)
    const isHidden = isScheduleCompletedForNextDate(plan, masterSchedules, '2026-11-17');
    expect(isHidden).toBe(false); // false means do NOT hide -> display!
  });

  it('does NOT display on the next date or next next date when schedule is completed', () => {
    const plan = {
      Sch_Id: '100',
      Task_Assign_dt: '2026-11-17',
    };

    // Next date (2026-11-18)
    const isHiddenNextDate = isScheduleCompletedForNextDate(plan, masterSchedules, '2026-11-18');
    expect(isHiddenNextDate).toBe(true); // true means HIDE -> no display!

    // Next next date (2026-11-19)
    const isHiddenNextNextDate = isScheduleCompletedForNextDate(plan, masterSchedules, '2026-11-19');
    expect(isHiddenNextNextDate).toBe(true); // true means HIDE -> no display!
  });

  it('keeps displaying and rolling over to next next date when schedule is NOT completed', () => {
    const plan = {
      Sch_Id: '200',
      Task_Assign_dt: '2026-11-17',
    };

    // Same date
    expect(isScheduleCompletedForNextDate(plan, masterSchedules, '2026-11-17')).toBe(false);
    // Next date
    expect(isScheduleCompletedForNextDate(plan, masterSchedules, '2026-11-18')).toBe(false);
    // Next next date
    expect(isScheduleCompletedForNextDate(plan, masterSchedules, '2026-11-19')).toBe(false);
  });

  it('displays assigned details date-wise from assign start date up to completed date only', () => {
    const completedPlan = {
      Sch_Id: '300',
      Schedule_Sch_Start_Date: '2026-11-10',
      Schedule_Sch_Comp_Date: '2026-11-15',
      Schedule_Sch_Status: 3,
    };

    const schedules = [
      {
        schId: 300,
        schStatus: 3,
        schStartDate: '2026-11-10',
        schCompDate: '2026-11-15',
      },
    ];

    // Before assign start date -> do NOT display
    expect(isScheduleCompletedForNextDate(completedPlan, schedules, '2026-11-09')).toBe(true);

    // Between start date and completed date -> DO display
    expect(isScheduleCompletedForNextDate(completedPlan, schedules, '2026-11-10')).toBe(false);
    expect(isScheduleCompletedForNextDate(completedPlan, schedules, '2026-11-12')).toBe(false);
    expect(isScheduleCompletedForNextDate(completedPlan, schedules, '2026-11-15')).toBe(false);

    // After completed date (next next dates) -> do NOT display
    expect(isScheduleCompletedForNextDate(completedPlan, schedules, '2026-11-16')).toBe(true);
    expect(isScheduleCompletedForNextDate(completedPlan, schedules, '2026-11-17')).toBe(true);
  });
});

