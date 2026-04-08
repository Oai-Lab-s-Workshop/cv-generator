import { Injectable } from '@angular/core';
import PocketBase from 'pocketbase';
import { environment } from '../../../environments/environment';
import { Competence } from '../models/competence.model';
import { CvData } from '../models/cv-data.model';
import { CvProfile } from '../models/cv-profile.model';
import { Diplome } from '../models/diplome.model';
import { Emploi } from '../models/emploi.model';
import { Person } from '../models/person.model';
import { Projet } from '../models/projet.model';

@Injectable({ providedIn: 'root' })
export class PocketBaseService {
  private readonly pb = new PocketBase(environment.pocketbaseUrl);

  async getCvProfileById(cvProfileId: string): Promise<CvProfile> {
    return this.pb.collection<CvProfile>('cv_profiles').getOne(cvProfileId);
  }

  async getCvProfileBySlug(slug: string): Promise<CvProfile> {
    return this.pb.collection<CvProfile>('cv_profiles').getFirstListItem(`slug="${slug}"`);
  }

  async getPerson(cvProfileId: string): Promise<Person | null> {
    try {
      return await this.pb.collection<Person>('persons').getFirstListItem(`cv_profile="${cvProfileId}"`);
    } catch {
      return null;
    }
  }

  async getEmplois(cvProfileId: string): Promise<Emploi[]> {
    return this.pb.collection<Emploi>('emplois').getFullList({
      filter: `cv_profile="${cvProfileId}"`,
      sort: '+sort_order,-date_start',
    });
  }

  async getProjets(cvProfileId: string): Promise<Projet[]> {
    return this.pb.collection<Projet>('projets').getFullList({
      filter: `cv_profile="${cvProfileId}"`,
      sort: '+sort_order,-date',
    });
  }

  async getCompetences(cvProfileId: string): Promise<Competence[]> {
    return this.pb.collection<Competence>('competences').getFullList({
      filter: `cv_profile="${cvProfileId}"`,
      sort: '+sort_order,+name',
    });
  }

  async getDiplomes(cvProfileId: string): Promise<Diplome[]> {
    return this.pb.collection<Diplome>('diplomes').getFullList({
      filter: `cv_profile="${cvProfileId}"`,
      sort: '+sort_order,-year',
    });
  }

  async getAllCvProfiles(): Promise<CvProfile[]> {
    return this.pb.collection<CvProfile>('cv_profiles').getFullList({
      sort: '+name',
    });
  }

  async getCvDataByProfileId(cvProfileId: string): Promise<CvData> {
    const [profile, person, emplois, projets, competences, diplomes] = await Promise.all([
      this.getCvProfileById(cvProfileId),
      this.getPerson(cvProfileId),
      this.getEmplois(cvProfileId),
      this.getProjets(cvProfileId),
      this.getCompetences(cvProfileId),
      this.getDiplomes(cvProfileId),
    ]);

    return {
      profile,
      person,
      emplois,
      projets,
      competences,
      diplomes,
    };
  }
}
