'use client';

import { useState, useEffect } from 'react';
import Select from 'react-select';

interface Location {
  id: string;
  name: string;
}

interface LocationSelectProps {
  initialProvinceId?: string;
  initialRegencyId?: string;
  initialDistrictId?: string;
  initialVillageId?: string;
}

export default function LocationSelect({
  initialProvinceId = '',
  initialRegencyId = '',
  initialDistrictId = '',
  initialVillageId = '',
}: LocationSelectProps) {
  const [provinces, setProvinces] = useState<Location[]>([]);
  const [regencies, setRegencies] = useState<Location[]>([]);
  const [districts, setDistricts] = useState<Location[]>([]);
  const [villages, setVillages] = useState<Location[]>([]);

  const [provinceId, setProvinceId] = useState(initialProvinceId);
  const [regencyId, setRegencyId] = useState(initialRegencyId);
  const [districtId, setDistrictId] = useState(initialDistrictId);
  const [villageId, setVillageId] = useState(initialVillageId);

  const [loading, setLoading] = useState('');

  // Initial fetch provinces
  useEffect(() => {
    setLoading('province');
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then(res => res.json())
      .then(data => {
        setProvinces(data);
        setLoading('');
      })
      .catch(() => setLoading(''));
  }, []);

  // Fetch regencies when province changes
  useEffect(() => {
    if (!provinceId) {
      setRegencies([]);
      setRegencyId('');
      return;
    }
    setLoading('regency');
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`)
      .then(res => res.json())
      .then(data => {
        setRegencies(data);
        setLoading('');
      })
      .catch(() => setLoading(''));
  }, [provinceId]);

  // Fetch districts when regency changes
  useEffect(() => {
    if (!regencyId) {
      setDistricts([]);
      setDistrictId('');
      return;
    }
    setLoading('district');
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${regencyId}.json`)
      .then(res => res.json())
      .then(data => {
        setDistricts(data);
        setLoading('');
      })
      .catch(() => setLoading(''));
  }, [regencyId]);

  // Fetch villages when district changes
  useEffect(() => {
    if (!districtId) {
      setVillages([]);
      setVillageId('');
      return;
    }
    setLoading('village');
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${districtId}.json`)
      .then(res => res.json())
      .then(data => {
        setVillages(data);
        setLoading('');
      })
      .catch(() => setLoading(''));
  }, [districtId]);

  const selectedProvince = provinces.find(p => p.id === provinceId);
  const selectedRegency = regencies.find(p => p.id === regencyId);
  const selectedDistrict = districts.find(p => p.id === districtId);
  const selectedVillage = villages.find(p => p.id === villageId);

  // Custom styles untuk react-select agar menyatu dengan tema aplikasi
  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      borderRadius: '8px',
      borderColor: state.isFocused ? 'var(--brand-500)' : 'var(--bdr-strong)',
      backgroundColor: 'var(--bg-surface)',
      minHeight: '42px',
      boxShadow: state.isFocused ? '0 0 0 1px var(--brand-500)' : 'none',
      '&:hover': {
        borderColor: 'var(--brand-500)'
      }
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? 'var(--brand-500)' 
        : state.isFocused 
          ? 'var(--brand-50)' 
          : 'transparent',
      color: state.isSelected ? '#ffffff' : 'var(--txt-primary)',
      fontSize: '14px',
      cursor: 'pointer',
      padding: '8px 12px',
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: 'var(--txt-primary)',
      fontSize: '14px',
    }),
    input: (provided: any) => ({
      ...provided,
      color: 'var(--txt-primary)',
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: 'var(--txt-muted)',
      fontSize: '14px',
    }),
    menu: (provided: any) => ({
      ...provided,
      borderRadius: '8px',
      boxShadow: 'var(--shd-lg)',
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--bdr-subtle)',
      zIndex: 9999
    })
  };

  return (
    <div className="grid grid-cols-2" style={{ gap: '16px' }}>
      {/* Hidden inputs to send data with the form automatically */}
      <input type="hidden" name="provinceId" value={provinceId} />
      <input type="hidden" name="province" value={selectedProvince?.name || ''} />
      <input type="hidden" name="regencyId" value={regencyId} />
      <input type="hidden" name="regency" value={selectedRegency?.name || ''} />
      <input type="hidden" name="districtId" value={districtId} />
      <input type="hidden" name="district" value={selectedDistrict?.name || ''} />
      <input type="hidden" name="villageId" value={villageId} />
      <input type="hidden" name="village" value={selectedVillage?.name || ''} />

      <div className="form-group" style={{ position: 'relative', zIndex: 40 }}>
        <label className="form-label">Provinsi</label>
        <Select
          options={provinces.map(p => ({ value: p.id, label: p.name }))}
          value={provinces.length > 0 && provinceId ? { value: provinceId, label: selectedProvince?.name || 'Loading...' } : null}
          onChange={(opt: any) => setProvinceId(opt ? opt.value : '')}
          isLoading={loading === 'province'}
          isDisabled={loading === 'province'}
          placeholder="Cari Provinsi..."
          styles={customStyles}
          isClearable
          noOptionsMessage={() => "Tidak ada data"}
        />
      </div>

      <div className="form-group" style={{ position: 'relative', zIndex: 30 }}>
        <label className="form-label">Kabupaten/Kota</label>
        <Select
          options={regencies.map(r => ({ value: r.id, label: r.name }))}
          value={regencies.length > 0 && regencyId ? { value: regencyId, label: selectedRegency?.name || 'Loading...' } : null}
          onChange={(opt: any) => setRegencyId(opt ? opt.value : '')}
          isLoading={loading === 'regency'}
          isDisabled={!provinceId || loading === 'regency'}
          placeholder="Cari Kabupaten/Kota..."
          styles={customStyles}
          isClearable
          noOptionsMessage={() => "Pilih provinsi terlebih dahulu"}
        />
      </div>

      <div className="form-group" style={{ position: 'relative', zIndex: 20 }}>
        <label className="form-label">Kecamatan</label>
        <Select
          options={districts.map(d => ({ value: d.id, label: d.name }))}
          value={districts.length > 0 && districtId ? { value: districtId, label: selectedDistrict?.name || 'Loading...' } : null}
          onChange={(opt: any) => setDistrictId(opt ? opt.value : '')}
          isLoading={loading === 'district'}
          isDisabled={!regencyId || loading === 'district'}
          placeholder="Cari Kecamatan..."
          styles={customStyles}
          isClearable
          noOptionsMessage={() => "Pilih kabupaten terlebih dahulu"}
        />
      </div>

      <div className="form-group" style={{ position: 'relative', zIndex: 10 }}>
        <label className="form-label">Kelurahan/Desa</label>
        <Select
          options={villages.map(v => ({ value: v.id, label: v.name }))}
          value={villages.length > 0 && villageId ? { value: villageId, label: selectedVillage?.name || 'Loading...' } : null}
          onChange={(opt: any) => setVillageId(opt ? opt.value : '')}
          isLoading={loading === 'village'}
          isDisabled={!districtId || loading === 'village'}
          placeholder="Cari Kelurahan/Desa..."
          styles={customStyles}
          isClearable
          noOptionsMessage={() => "Pilih kecamatan terlebih dahulu"}
        />
      </div>
    </div>
  );
}
