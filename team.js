// Adaugă profiluri în `members` folosind: { name, role, image, bio, workshop }.
// Exemplu: { name: 'Ana Popescu', role: 'Actriță', image: 'images/echipa/ana.jpg', bio: '...' }
const juryMembers = [
  {
    name: 'Gabi Popescu',
    role: 'Jurat',
    image: 'images/meet the team/gp.jpeg',
    bio: 'Membru al juriului festivalului.',
    workshop: 'Arta Actorului'
  },
  {
    name: 'Madalina Floroaica',
    role: 'Jurat',
    image: 'images/meet the team/mf.jpeg',
    bio: 'Membru al juriului festivalului.',
    workshop: 'Arta Actorului'
  },
  {
    name: 'Liviu Cheloiu',
    role: 'Jurat',
    image: 'images/meet the team/lc.jpg',
    bio: 'Membru al juriului festivalului.',
    workshop: 'Arta Actorului de Film'
  },
];

const teamGroups = [
  {
    title: 'Jurați',
    image: 'images/meet the team/juriu.png',
    description: 'Descoperă membrii juriului festivalului.',
    memberLabel: 'Jurat',
    memberCount: 3,
    members: juryMembers
  },
  {
    title: 'Trupa Leira',
    image: 'images/meet the team/foto trupa.jpg',
    description: 'Descoperă membrii trupei organizatoare.',
    memberLabel: 'Membru',
    memberCount: 14,
    focusFaces: true,
    members: [
      { name: 'Alexandra Popescu', image: 'images/meet the team/apop.jpeg' },
      { name: 'Alexandra Palea', image: 'images/meet the team/ap.jpeg' },
      { name: 'Anastasia Nicolae', image: 'images/meet the team/an.jpeg' },
      { name: 'Alexia Lupu', image: 'images/meet the team/al.jpeg' },
      { name: 'Andrei Dita', image: 'images/meet the team/ad.jpeg' },
      { name: 'Rares Stamatie', image: 'images/meet the team/rs.jpeg' },
      { name: 'Rebeca Marin', image: 'images/meet the team/rm.jpg' },
      { name: 'Marta Todeci', image: 'images/meet the team/mt.jpeg' },
      { name: 'Gabriela Mititelu', image: 'images/meet the team/gm.jpeg' },
      { name: 'Stefania Constantin', image: 'images/meet the team/sc.jpeg' },
      { name: 'Daria Ghitulescu', image: 'images/meet the team/dg.jpeg' },
      { name: 'Teodora Zernic', image: 'images/meet the team/tz.jpg' },
      { name: 'Eduard Ignat', image: 'images/meet the team/ei.jpeg' },
      { name: 'Calin Ruiu', image: 'images/meet the team/cr.jpeg' }
    ]
  },
  {
    title: 'Traineri',
    image: 'images/meet the team/traineri.jpg',
    description: 'Descoperă trainerii festivalului.',
    memberLabel: 'Trainer',
    memberCount: 5,
    showWorkshops: true,
    members: [
      ...juryMembers,
      {
        name: 'Răzvan și Demetra',
        role: 'Traineri',
        image: 'images/meet the team/rd.jpeg',
        bio: 'Feel the Flow'
      },
      {
        name: 'Adelin Tudorache',
        role: 'Trainer',
        image: 'images/meet the team/at.jpg',
        bio: 'Performance Workshop'
      }
    ]
  }
];

const teamGroupsContainer = document.getElementById('team-groups');
const teamDialog = document.getElementById('team-dialog');
const teamDialogTitle = document.getElementById('team-dialog-title');
const teamDialogDescription = document.getElementById('team-dialog-description');
const teamMembersContainer = document.getElementById('team-members');

function createTeamVisual(imagePath, altText, className, placeholder) {
  if (imagePath) {
    const image = document.createElement('img');
    image.className = className;
    image.src = imagePath;
    image.alt = altText;
    image.loading = 'lazy';
    return image;
  }

  const visual = document.createElement('div');
  visual.className = className;
  visual.setAttribute('role', 'img');
  visual.setAttribute('aria-label', altText);
  visual.textContent = placeholder;
  return visual;
}

function renderTeamGroups() {
  teamGroups.forEach(function (group, index) {
    const card = document.createElement('button');
    card.className = 'team-group-card';
    card.type = 'button';
    card.setAttribute('aria-haspopup', 'dialog');
    card.setAttribute('aria-label', `Deschide secțiunea ${group.title}`);
    card.appendChild(createTeamVisual(
      group.image,
      `Fotografie pentru ${group.title}`,
      'team-group-image',
      'Adaugă fotografia categoriei'
    ));

    const title = document.createElement('span');
    title.className = 'team-group-name';
    title.textContent = group.title;
    card.appendChild(title);

    const hint = document.createElement('span');
    hint.className = 'team-group-hint';
    hint.textContent = 'Apasă pentru a vedea membrii';
    card.appendChild(hint);

    card.addEventListener('click', function () {
      openTeamGroup(index);
    });
    teamGroupsContainer.appendChild(card);
  });
}

function renderTeamMembers(group) {
  teamMembersContainer.replaceChildren();

  Array.from({ length: group.memberCount }, function (_, index) {
    return group.members[index] || {};
  }).forEach(function (member, index) {
    const card = document.createElement('article');
    card.className = 'team-member-card';
    if (group.focusFaces) {
      card.classList.add('team-member-card--face-focused');
    }
    card.appendChild(createTeamVisual(
      member.image,
      member.name ? `Fotografie cu ${member.name}` : 'Fotografie de profil',
      'team-member-photo',
      'Adaugă fotografia persoanei'
    ));

    const info = document.createElement('div');
    info.className = 'team-member-info';

    const name = document.createElement('h3');
    name.textContent = member.name || `${group.memberLabel} ${index + 1}`;
    info.appendChild(name);

    if (member.role) {
      const role = document.createElement('p');
      role.className = 'team-member-role';
      role.textContent = member.role;
      info.appendChild(role);
    }

    if (group.showWorkshops && member.workshop) {
      const workshop = document.createElement('p');
      workshop.className = 'team-member-workshop';
      workshop.textContent = `Workshop: ${member.workshop}`;
      info.appendChild(workshop);
    }

    if (member.bio) {
      const bio = document.createElement('p');
      bio.textContent = member.bio;
      info.appendChild(bio);
    } else if (!member.name) {
      const bioPlaceholder = document.createElement('p');
      bioPlaceholder.textContent = 'Adaugă aici informații despre această persoană.';
      info.appendChild(bioPlaceholder);
    }

    card.appendChild(info);
    teamMembersContainer.appendChild(card);
  });
}

function openTeamGroup(index) {
  const group = teamGroups[index];
  teamDialogTitle.textContent = group.title;
  teamDialogDescription.textContent = group.description;
  teamMembersContainer.classList.toggle('team-members--jury', group.title === 'Jurați');
  renderTeamMembers(group);
  teamDialog.showModal();
}

document.querySelector('.team-dialog-close').addEventListener('click', function () {
  teamDialog.close();
});

renderTeamGroups();
