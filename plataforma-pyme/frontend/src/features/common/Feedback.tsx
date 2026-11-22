import { Icon } from '../../app/Icon'
import { businessHref } from '../../app/navigation'
import type { DemoBusiness } from '../../app/navigation'
import type { Navigate } from '../../app/types'

export function ComingSoon({ title, description, navigate, business }: { title: string; description: string; navigate: Navigate; business?: DemoBusiness }) {
  return <>
    <div className="page-heading"><div><p className="eyebrow">ORBIT DEMO</p><h1>{title}</h1><p>{description}</p></div></div>
    <section className="empty-state">
      <div className="empty-icon"><Icon name="clock" size={36}/></div>
      <span className="soon-pill">Coming soon</span>
      <h2>We're preparing this section.</h2>
      <p>The design will be integrated from the original HTML selected in E0-A. For now this screen does not record or modify information.</p>
      <button type="button" className="button button-primary" onClick={() => navigate(business ? businessHref(business.id, 'inicio') : '/inicio')}><Icon name="home" size={17}/> Back to Top</button>
    </section>
  </>
}

export function NotFound({ navigate, accessDenied = false }: { navigate: Navigate; accessDenied?: boolean }) {
  return <section className="empty-state not-found">
    <div className="empty-icon"><Icon name="shield" size={34}/></div>
    <h1>{accessDenied ? 'Company not available' : 'We did not find this page'}</h1>
    <p>{accessDenied ? 'The requested company is not part of the example companies of this session. Your data are not shown.' : 'The address requested does not correspond to a section available.'}</p>
    <button type="button" className="button button-primary" onClick={() => navigate('/inicio')}>Back to my space</button>
  </section>
}
