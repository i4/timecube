import { BehaviorSubject, Observable } from 'rxjs';
import { Series } from '@/model/series';

export class SeriesService {
    private series: BehaviorSubject<Series[]> = new BehaviorSubject(new Array());

    constructor() { }

    getSeries(): Observable<Series[]> {
        return this.series.asObservable();
    }

    setSeries(series: Series[]) {
        this.series.next(series);
    }
}