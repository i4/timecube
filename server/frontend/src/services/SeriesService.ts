import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Series } from '@/model/series';

export class SeriesService {
    private series: BehaviorSubject<Series[]> = new BehaviorSubject(new Array());
    private hidden: BehaviorSubject<string[]> = new BehaviorSubject(new Array());

    constructor() { }

    getSeries(): Observable<Series[]> {
        return combineLatest(
            this.series.asObservable(),
            this.hidden.asObservable()
        ).pipe(
            map(([series, hidden]) => {
                return series.map(s => {
                    if (hidden.findIndex(h => s.task === h) >= 0) {
                        s.hide = true;
                    } else {
                        s.hide = false;
                    }
                    return s;
                });
            })
        );
    }

    setSeries(series: Series[]) {
        this.series.next(series);
    }

    setHidden(hidden: string[]) {
        this.hidden.next(hidden);
    }
}