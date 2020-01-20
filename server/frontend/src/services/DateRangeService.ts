import { DateRange } from '@/model/daterange';
import { BehaviorSubject, Observable } from 'rxjs';
import moment from 'moment';

export class DateRangeService {
    private dateRange: BehaviorSubject<DateRange> = new BehaviorSubject({ start: moment(), end: moment() });

    constructor() { }

    getDateRange(): Observable<DateRange> {
        return this.dateRange.asObservable();
    }

    setDateRange(dateRange: DateRange) {
        this.dateRange.next(dateRange);
    }
}