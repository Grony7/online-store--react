import styles from './Catalog.module.scss';
import { IGetCatalog, CatalogProps} from './Catalog.props.ts';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { IProduct } from '../../interfaces/product.interface.ts';
import { useEffect, useState } from 'react';
import Title from '../../components/Title/Title.tsx';
import ProductCard from '../../components/ProductCard/ProductCard.tsx';
import FilterPanel from '../../components/FilterPanel/FilterPanel.tsx';

const Catalog = ({ ...props }: CatalogProps) => {
  const { slug } = useParams<string>();
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [category, setCategory] = useState<string>();
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[] | number[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Состояние для пагинации
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const pageSize = 6;

  // Извлечение фильтров из URL при загрузке страницы
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const filtersFromUrl: Record<string, string[] | number[]> = {};

    // Получаем номер страницы из URL
    const pageFromUrl = queryParams.get('page');
    const page = pageFromUrl ? parseInt(pageFromUrl) : 1;
    setCurrentPage(page);

    // Получаем параметры цены
    const priceMin = queryParams.get('priceMin');
    const priceMax = queryParams.get('priceMax');
    if (priceMin && priceMax) {
      filtersFromUrl.priceRange = [parseInt(priceMin), parseInt(priceMax)];
    }

    // Получаем другие параметры фильтрации
    // Используем getAll для получения всех значений параметра с одинаковым ключом
    Array.from(new Set(queryParams.keys())).forEach(key => {
      if (key !== 'priceMin' && key !== 'priceMax' && key !== 'page') {
        // Сохраняем все значения параметра как есть, без разделения
        const values = queryParams.getAll(key);

        // Проверяем, являются ли все значения числами
        const allNumbers = values.every(val => !isNaN(Number(val)) && val.trim() !== '');

        if (allNumbers) {
          // Если все значения числовые, преобразуем их в числа
          filtersFromUrl[key] = values.map(val => Number(val));
        } else {
          // Иначе оставляем как строки
          filtersFromUrl[key] = values;
        }
      }
    });

    // Если есть фильтры в URL, применяем их
    if (Object.keys(filtersFromUrl).length > 0) {
      console.log('Filters from URL:', filtersFromUrl);
      setActiveFilters(filtersFromUrl);
      getProducts(filtersFromUrl, page);
    } else {
      getProducts({}, page);
    }
  }, [slug, location.search]);

  const getProducts = async (filters?: Record<string, string[] | number[]>, page: number = 1) => {
    setIsLoading(true);
    try {
      // Формируем параметры запроса из фильтров
      const params: Record<string, string | string[]> = {
        page: page.toString(),
        pageSize: pageSize.toString()
      };

      if (filters) {
        console.log('Filters for API request:', filters);
        // Обработка диапазона цен
        if (filters.priceRange && Array.isArray(filters.priceRange) && filters.priceRange.length === 2) {
          params.priceMin = filters.priceRange[0].toString();
          params.priceMax = filters.priceRange[1].toString();
        }

        // Обработка других фильтров (RAM, cores и т.д.)
        Object.entries(filters).forEach(([key, value]) => {
          if (key !== 'priceRange' && Array.isArray(value) && value.length > 0) {
            // Вместо join используем отдельные параметры для каждого значения
            // Axios автоматически обрабатывает массивы как отдельные параметры с одинаковым ключом
            params[key] = value.map(val => val.toString()).filter(val => val.trim());
          }
        });
      }

      console.log('API request params:', params);
      const { data } = await axios.get<IGetCatalog>(
        `${import.meta.env.VITE_API_URL}/api/products/category/${slug}`,
        { params }
      );

      setCategory(data.data.category.name);
      setProducts(data.data.products);
      setTotalPages(data.meta.pagination.pageCount);
      setTotalProducts(data.meta.pagination.total);
      setCurrentPage(data.meta.pagination.page);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterApply = (selectedFilters: Record<string, string[] | number[]>) => {
    setActiveFilters(selectedFilters);
    setCurrentPage(1); // Сбрасываем на первую страницу при применении фильтров

    // Обновляем URL с новыми параметрами фильтрации
    const queryParams = new URLSearchParams();

    // Добавляем номер страницы (всегда 1 при новых фильтрах)
    queryParams.set('page', '1');

    // Добавляем параметры цены
    if (selectedFilters.priceRange && Array.isArray(selectedFilters.priceRange) && selectedFilters.priceRange.length === 2) {
      queryParams.set('priceMin', selectedFilters.priceRange[0].toString());
      queryParams.set('priceMax', selectedFilters.priceRange[1].toString());
    }

    // Добавляем другие параметры
    Object.entries(selectedFilters).forEach(([key, value]) => {
      if (key !== 'priceRange' && Array.isArray(value) && value.length > 0) {
        // Для каждого значения добавляем отдельный параметр с одинаковым ключом
        value.forEach(val => {
          const strVal = String(val); // Гарантируем, что значение - строка
          if (strVal.trim()) { // Добавляем только непустые значения
            queryParams.append(key, strVal);
          }
        });
      }
    });

    // Формируем новый URL и выполняем навигацию
    const newUrl = queryParams.toString()
      ? `${location.pathname}?${queryParams.toString()}`
      : location.pathname;

    console.log('New URL:', newUrl);
    navigate(newUrl, { replace: true });

    // Запрашиваем продукты с новыми фильтрами
    getProducts(selectedFilters, 1);
    setIsFilterVisible(false);
  };

  // Функция для смены страницы
  const handlePageChange = (page: number) => {
    setCurrentPage(page);

    // Обновляем URL с новым номером страницы
    const queryParams = new URLSearchParams(location.search);
    queryParams.set('page', page.toString());

    const newUrl = `${location.pathname}?${queryParams.toString()}`;
    navigate(newUrl, { replace: true });

    // Запрашиваем продукты для новой страницы
    getProducts(activeFilters, page);

    // Прокручиваем страницу вверх
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Переключение видимости фильтра
  const toggleFilter = () => {
    setIsFilterVisible(!isFilterVisible);
  };

  return (
    <section className={styles.wrapper} {...props}>
      <div className={styles.header}>
        <button className={styles.backButton}>
          <svg width="8" height="16" viewBox="0 0 8 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 1L1 8L7 15" stroke="#0C0C0C" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <Title level={1}>{category}</Title>
      </div>

      <div className={styles.content}>
        {/* Панель фильтров (видима только на десктопе) */}
        <div className={styles.filtersWrapper}>
          <FilterPanel
            categorySlug={slug}
            onApply={handleFilterApply}
            initialFilters={activeFilters}
            className={styles.filtersPanel}
          />
        </div>

        <div className={styles.productsSection}>
          <div className={styles.filtersControls}>
            <button
              className={styles.filterButton}
              onClick={toggleFilter}
            >
              <svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 1H1M11 6H3M9 11H5" stroke="#454545" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Фильтры
            </button>
            <button className={styles.sortButton}>
              <div className={styles.sortIcon}>
                <svg width="6" height="12" viewBox="0 0 6 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 1L5 3M3 1L1 3M3 1V5" stroke="#454545" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <svg width="6" height="12" viewBox="0 0 6 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 11L5 9M3 11L1 9M3 11V7" stroke="#454545" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              По популярности
            </button>
          </div>

          <div className={styles.grid}>
            {isLoading ? (
              <div className={styles.loading}>Загрузка...</div>
            ) : products.length > 0 ? (
              products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className={styles.empty}>Товары не найдены</div>
            )}
          </div>

          {/* Пагинация */}
          {!isLoading && totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={`${styles.paginationButton} ${currentPage === 1 ? styles.disabled : ''}`}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <svg width="8" height="16" viewBox="0 0 8 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 1L1 8L7 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                const isCurrentPage = page === currentPage;
                const shouldShow = Math.abs(page - currentPage) <= 2 || page === 1 || page === totalPages;

                if (!shouldShow) {
                  if (page === currentPage - 3 || page === currentPage + 3) {
                    return <span key={page} className={styles.paginationDots}>...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={page}
                    className={`${styles.paginationButton} ${isCurrentPage ? styles.active : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                className={`${styles.paginationButton} ${currentPage === totalPages ? styles.disabled : ''}`}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <svg width="8" height="16" viewBox="0 0 8 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L7 8L1 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )}

          {/* Информация о результатах */}
          {!isLoading && totalProducts > 0 && (
            <div className={styles.resultsInfo}>
              Показано {Math.min((currentPage - 1) * pageSize + 1, totalProducts)} - {Math.min(currentPage * pageSize, totalProducts)} из {totalProducts} товаров
            </div>
          )}
        </div>
      </div>

      {/* Мобильная панель фильтров */}
      {isFilterVisible && (
        <div className={styles.mobileFilterOverlay} onClick={toggleFilter}></div>
      )}
      <div className={`${styles.mobileFilterPanel} ${isFilterVisible ? styles.visible : ''}`}>
        <div className={styles.mobileFilterHeader}>
          <h3 className={styles.mobileFilterTitle}>Фильтры</h3>
          <button className={styles.closeButton} onClick={toggleFilter}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L13 13M1 13L13 1" stroke="#454545" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className={styles.mobileFilterContent}>
          <FilterPanel
            categorySlug={slug}
            onApply={handleFilterApply}
            initialFilters={activeFilters}
            onVisibilityChange={setIsFilterVisible}
          />
        </div>
      </div>
    </section>
  );
};

export default Catalog;
