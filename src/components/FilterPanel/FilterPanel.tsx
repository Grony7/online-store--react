import { useEffect, useState } from 'react';
import axios from 'axios';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { FilterPanelProps } from './FilterPanel.props';
import styles from './FilterPanel.module.scss';
import { IFilters, IGetFilters } from '../../interfaces/filter-panel.interface.ts';

const API_URL = import.meta.env.VITE_API_URL;

const FilterPanel = ({
  categorySlug,
  onApply,
  onVisibilityChange,
  initialFilters,
  className,
  ...props
}: FilterPanelProps) => {
  const [filters, setFilters] = useState<IFilters | null>(null);
  const [selected, setSelected] = useState<Record<string, string[] | number[]>>({});
  const [minPriceInput, setMinPriceInput] = useState<string>('');
  const [maxPriceInput, setMaxPriceInput] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  const isMobileMode = onVisibilityChange !== undefined;


  const fetchAndInitializeFilters = async () => {
    try {
      // 1. Запрашиваем фильтры для категории
      const {data} = await axios.get<IGetFilters>(
        `${API_URL}/api/categories/${categorySlug}/filters`
      );
      const filtersFromApi = data.filters;
      setFilters(filtersFromApi);

      const initialValues: Record<string, string[] | number[]> = {
        priceRange: [filtersFromApi.priceRange.min, filtersFromApi.priceRange.max],
      };

      filtersFromApi.specifications.forEach((spec) => {
        initialValues[spec.slug] = [];
      });

      // 3. Если переданы initialFilters, перезаписываем для них значения
      if (initialFilters) {
        Object.entries(initialFilters).forEach(([key, value]) => {
          if (key === 'priceRange' && Array.isArray(value) && value.length === 2) {
            initialValues.priceRange = value;
            setMinPriceInput(String(value[0]));
            setMaxPriceInput(String(value[1]));
          } else if (key !== 'priceRange' && Array.isArray(value)) {
            // приводим всё к строке
            initialValues[key] = value.map((val) => String(val));
          }
        });
      } else {
        // 4. Если начальных фильтров нет, устанавливаем значения полей ввода цены
        setMinPriceInput(String(filtersFromApi.priceRange.min));
        setMaxPriceInput(String(filtersFromApi.priceRange.max));
      }

      setSelected(initialValues);
      setIsInitialized(true);
    } catch (error) {
      console.error('Ошибка при загрузке фильтров:', error);
    }
  };

  useEffect(() => {
    if (!categorySlug) return;
    fetchAndInitializeFilters();
  }, [categorySlug, initialFilters]);


  // Убедимся, что поля ввода цены всегда содержат актуальные значения из состояния selected
  useEffect(() => {
    if (isInitialized && selected.priceRange && Array.isArray(selected.priceRange) && selected.priceRange.length === 2) {
      setMinPriceInput(selected.priceRange[0].toString());
      setMaxPriceInput(selected.priceRange[1].toString());
    }
  }, [isInitialized, selected.priceRange]);

  // Обновляет значение слайдера при изменении текстовых полей
  const handlePriceInputChange = (isMin: boolean, value: string) => {
    if (value === '' || /^\d+$/.test(value)) {
      if (isMin) {
        setMinPriceInput(value);

        if (value === '') return;

        const newMin = parseInt(value);
        if (filters && newMin >= filters.priceRange.min && newMin <= (selected.priceRange as number[])[1]) {
          setSelected(prev => ({
            ...prev,
            priceRange: [newMin, (prev.priceRange as number[])[1]]
          }));
        }
      } else {
        setMaxPriceInput(value);

        if (value === '') return;

        const newMax = parseInt(value);
        if (filters && newMax <= filters.priceRange.max && newMax >= (selected.priceRange as number[])[0]) {
          setSelected(prev => ({
            ...prev,
            priceRange: [(prev.priceRange as number[])[0], newMax]
          }));
        }
      }
    }
  };

  // Обработка потери фокуса полем ввода цены
  const handlePriceInputBlur = (isMin: boolean) => {
    if (!filters) return;

    if (isMin) {
      if (minPriceInput === '' || parseInt(minPriceInput) < filters.priceRange.min) {
        setMinPriceInput(filters.priceRange.min.toString());
        setSelected(prev => ({
          ...prev,
          priceRange: [filters.priceRange.min, (prev.priceRange as number[])[1]]
        }));
      }
    } else {
      if (maxPriceInput === '' || parseInt(maxPriceInput) > filters.priceRange.max) {
        setMaxPriceInput(filters.priceRange.max.toString());
        setSelected(prev => ({
          ...prev,
          priceRange: [(prev.priceRange as number[])[0], filters.priceRange.max]
        }));
      }
    }
  };

  // Определяем классы в зависимости от состояния
  const filterPanelClasses = `${styles.filterPanel} ${isMobileMode ? '' : className || ''}`;

  if (!filters) {
    return null;
  }

  // переключить чекбокс
  const toggleOption = (slug: string, val: string) => {
    setSelected(prev => {
      const arr = prev[slug] as string[];
      const next = arr.includes(val)
        ? arr.filter(x => x !== val)
        : [...arr, val];
      return { ...prev, [slug]: next };
    });
  };

  const handleApply = () => {
    console.log('Selected filters before apply:', selected);
    onApply(selected);
    if (onVisibilityChange) {
      onVisibilityChange(false);
    }
  };

  const getFilterValue = (slug: string): string[] => {
    const values = (selected[slug] as string[]) || [];
    return values.map(val => String(val)); // Гарантируем, что все значения - строки
  };

  // Обновляет текстовые поля при изменении слайдера
  const handleSliderChange = (val: number | number[]) => {
    const newValues = Array.isArray(val) ? val : [val, val];
    setSelected(prev => ({ ...prev, priceRange: newValues }));
    setMinPriceInput(newValues[0].toString());
    setMaxPriceInput(newValues[1].toString());
  };

  return (
    <div className={filterPanelClasses} {...props}>
      {!isMobileMode && (
        <div className={styles.filterHeader}>
          <h3 className={styles.filterTitle}>Фильтры</h3>
        </div>
      )}

      <div className={styles.filterGroup}>
        <label className={styles.filterGroupTitle}>Цена, ₽</label>
        <Slider
          range
          min={filters.priceRange.min}
          max={filters.priceRange.max}
          value={selected.priceRange as number[]}
          onChange={handleSliderChange}
          className={styles.slider}
        />
        <div className={styles.priceInputs}>
          <div className={styles.priceInputWrapper}>
            <input
              type="text"
              className={styles.priceInputField}
              value={minPriceInput}
              onChange={(e) => handlePriceInputChange(true, e.target.value)}
              onBlur={() => handlePriceInputBlur(true)}
              placeholder="от"
            />
            <span className={styles.priceSymbol}>₽</span>
          </div>
          <div className={styles.priceInputWrapper}>
            <input
              type="text"
              className={styles.priceInputField}
              value={maxPriceInput}
              onChange={(e) => handlePriceInputChange(false, e.target.value)}
              onBlur={() => handlePriceInputBlur(false)}
              placeholder="до"
            />
            <span className={styles.priceSymbol}>₽</span>
          </div>
        </div>
      </div>

      {/* Динамические спецификации */}
      {filters.specifications.map(spec => {
        // список опций для отрисовки
        const opts = spec.options && spec.options.length > 0
          ? spec.options
          : spec.values;

        // Получаем текущие выбранные значения для этого фильтра
        const selectedValues = getFilterValue(spec.slug);
        console.log(`Spec ${spec.slug}, selected values:`, selectedValues);

        return (
          <div className={styles.filterGroup} key={spec.id}>
            <label className={styles.filterGroupTitle}>{spec.name}</label>
            <div className={styles.options}>
              {/* Используем чекбоксы для всех типов фильтров */}
              {opts.map(opt => {
                const isChecked = selectedValues.includes(String(opt));
                return (
                  <div key={opt} className={styles.optionItem}>
                    <input
                      type="checkbox"
                      id={`${spec.slug}-${opt}`}
                      checked={isChecked}
                      onChange={() => toggleOption(spec.slug, String(opt))}
                      className={styles.checkbox}
                    />
                    <div className={styles.checkboxCustom}>
                      {isChecked && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 3.5L4 6.5L9 1.5" stroke="#091D9E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <label htmlFor={`${spec.slug}-${opt}`} className={styles.optionLabel}>{opt}</label>
                  </div>
                );
              })}
            </div>
            {opts.length > 5 && (
              <button className={styles.showMoreButton}>Ещё</button>
            )}
          </div>
        );
      })}

      {/* Кнопки действий */}
      <div className={styles.filterActions}>
        <button className={styles.showAllButton}>
          Показать все фильтры
        </button>
        <button
          className={styles.applyButton}
          onClick={handleApply}
        >
          Применить
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;
