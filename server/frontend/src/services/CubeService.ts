import { BehaviorSubject, Observable } from 'rxjs';
import { Cube } from '@/model/cube';

export class CubeService {
    private cubes: BehaviorSubject<Cube[]> = new BehaviorSubject(new Array());

    constructor() { }

    getCubes(): Observable<Cube[]> {
        return this.cubes.asObservable();
    }

    setCubes(cubes: Cube[]) {
        this.cubes.next(cubes);
    }
}