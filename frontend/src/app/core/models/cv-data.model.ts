import { Competence } from './competence.model';
import { CvProfile } from './cv-profile.model';
import { Diplome } from './diplome.model';
import { Emploi } from './emploi.model';
import { Person } from './person.model';
import { Projet } from './projet.model';

export interface CvData {
  profile: CvProfile;
  person: Person | null;
  emplois: Emploi[];
  projets: Projet[];
  competences: Competence[];
  diplomes: Diplome[];
}
