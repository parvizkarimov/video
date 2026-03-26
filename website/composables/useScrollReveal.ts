interface ScrollRevealOptions {
  selectors: string[];
  threshold?: number;
  rootMargin?: string;
}

export const useScrollReveal = (configuration: ScrollRevealOptions) => {
  const {
    selectors,
    threshold = 0.1,
    rootMargin = "0px 0px -50px 0px",
  } = configuration;

  onMounted(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold, rootMargin },
    );

    for (const selector of selectors) {
      document.querySelectorAll(selector).forEach((element) => {
        observer.observe(element);
      });
    }
  });
};
